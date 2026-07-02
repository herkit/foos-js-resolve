/**
 * Phase 4 — reSolve (MySQL) -> Emmett (PostgreSQL) event migration.
 *
 * Reads the reSolve `events` table in commit order (threadId, threadCounter),
 * maps each event to its Emmett stream, and appends it to a fresh event store.
 * Because the store is created with the read-model projections registered
 * inline, appending replays them, rebuilding all read models. The saga is NOT
 * started here, but it IS a durable reactor that replays from the BEGINNING on
 * first boot unless it has a stored checkpoint. So after importing we seed the
 * saga's checkpoint to the log head (see `seed-saga-checkpoint.ts`); otherwise
 * the app's first boot would re-act to every historical LEAGUE_CREATED /
 * SEASON_CREATED and, for any orphan season (created but never started in
 * reSolve), append a spurious SEASON_STARTED that hijacks the league's current
 * season and blanks its ranks.
 *
 * Run (against a FRESH target database):
 *   MIG_MYSQL_URL=mysql://root:root@localhost:3307/foos-events \
 *   EVENTSTORE_CONNECTION_STRING=postgresql://foos:foos@localhost:5432/foos_migrated \
 *   node -r ts-node/register migrate/import-resolve-events.ts
 *
 * Reruns: the import only APPENDS — it never cleans the target. Against a
 * non-empty store it would double every event, so the script refuses to run if
 * the target already has events. Set `MIG_TRUNCATE=1` to wipe the target
 * (Emmett tables + read-model collections, and the global-position sequence)
 * before importing.
 *
 * SSL / managed Postgres (e.g. DigitalOcean): the target URL is passed straight
 * to `pg`, and `pg-connection-string` (>=2.13) now treats `sslmode=require` as
 * an alias for `verify-full` — full CA-chain verification. Managed providers use
 * a self-signed CA, so `?sslmode=require` fails with SELF_SIGNED_CERT_IN_CHAIN.
 * Fixes for the target URL:
 *   - Quickest: `?sslmode=no-verify` (still TLS-encrypted, skips CA verification).
 *   - Secure:   `?sslmode=verify-full&sslrootcert=/abs/path/to/ca-certificate.crt`
 *               (download the CA from the provider's connection details).
 */
import mysql from 'mysql2/promise';
import { getPostgreSQLEventStore } from '@event-driven-io/emmett-postgresql';
import { projections } from '@event-driven-io/emmett';
import { readModelProjections } from '../src/read-models/read-model.projections';
import { streamIdFor } from './stream-mapping';
import { seedSagaCheckpoint } from './seed-saga-checkpoint';
import { targetHasEvents, truncateTarget } from './truncate-target';

interface EventRow {
  timestamp: string | number;
  aggregateId: string;
  aggregateVersion: string | number;
  type: string;
  payload: Record<string, unknown> | null;
}

const MYSQL_URL =
  process.env.MIG_MYSQL_URL ?? 'mysql://root:root@localhost:3307/foos-events';
const PG_URL =
  process.env.EVENTSTORE_CONNECTION_STRING ??
  'postgresql://foos:foos@localhost:5432/foos_migrated';

const toData = (row: EventRow): Record<string, unknown> => {
  // reSolve stored an absent payload as JSON null (e.g. PLAYER_DELETED).
  const data: Record<string, unknown> = row.payload ? { ...row.payload } : {};
  // SeasonRanks/PlayerMatches read event.data.timestamp; reSolve kept it in a
  // column, so carry it into the payload for match-registration events.
  if (row.type === 'SEASON_MATCH_REGISTERED') {
    data.timestamp = Number(row.timestamp);
  }
  return data;
};

async function main(): Promise<void> {
  console.log(`Source MySQL:  ${MYSQL_URL.replace(/:[^:@/]*@/, ':****@')}`);
  console.log(`Target Postgres: ${PG_URL.replace(/:[^:@/]*@/, ':****@')}`);

  // The import only appends, so a rerun against a non-empty target would double
  // every event. Refuse unless MIG_TRUNCATE=1 was set to opt into a clean wipe.
  if (await targetHasEvents(PG_URL)) {
    if (process.env.MIG_TRUNCATE !== '1') {
      throw new Error(
        'Target already contains events. Rerunning would duplicate them. ' +
          'Re-run with MIG_TRUNCATE=1 to truncate the target first, or point ' +
          'EVENTSTORE_CONNECTION_STRING at a fresh database.',
      );
    }
    console.log('MIG_TRUNCATE=1 set — wiping target before import...');
    await truncateTarget(PG_URL);
  }

  const source = await mysql.createConnection(MYSQL_URL);
  const store = getPostgreSQLEventStore(PG_URL, {
    projections: projections.inline(readModelProjections),
  });

  // Replay in chronological (commit-time) order. `timestamp` is the authoritative
  // global order; (threadId, threadCounter) are only reSolve partition coordinates
  // and do NOT reflect cross-aggregate order. aggregateVersion breaks same-ms ties
  // so a stream's events stay in version order.
  const [rows] = await source.query<mysql.RowDataPacket[]>(
    'SELECT `timestamp`, aggregateId, aggregateVersion, `type`, payload ' +
      'FROM events ORDER BY `timestamp`, aggregateVersion, threadId, threadCounter',
  );

  const byType: Record<string, number> = {};
  let migrated = 0;

  for (const r of rows as unknown as EventRow[]) {
    const streamId = streamIdFor(r.type, r.aggregateId);
    await store.appendToStream(streamId, [{ type: r.type, data: toData(r) }]);
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    migrated += 1;
    if (migrated % 500 === 0) console.log(`  ...${migrated}/${rows.length}`);
  }

  console.log(`\nMigrated ${migrated} events:`);
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }

  await source.end();
  await store.close();

  // Stop the saga replaying this freshly-imported history on the app's first boot.
  await seedSagaCheckpoint(PG_URL);

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
