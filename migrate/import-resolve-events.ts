/**
 * Phase 4 — reSolve (MySQL) -> Emmett (PostgreSQL) event migration.
 *
 * Reads the reSolve `events` table in commit order (threadId, threadCounter),
 * maps each event to its Emmett stream, and appends it to a fresh event store.
 * Because the store is created with the read-model projections registered
 * inline, appending replays them, rebuilding all read models. The saga is NOT
 * started, so historical LEAGUE_CREATED/SEASON_CREATED events are not re-acted
 * upon (their downstream events are already in the log and get replayed too).
 *
 * Run (against a FRESH target database):
 *   MIG_MYSQL_URL=mysql://root:root@localhost:3307/foos-events \
 *   EVENTSTORE_CONNECTION_STRING=postgresql://foos:foos@localhost:5432/foos_migrated \
 *   node -r ts-node/register migrate/import-resolve-events.ts
 */
import mysql from 'mysql2/promise';
import { getPostgreSQLEventStore } from '@event-driven-io/emmett-postgresql';
import { projections } from '@event-driven-io/emmett';
import { readModelProjections } from '../src/read-models/read-model.projections';
import { streamIdFor } from './stream-mapping';

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
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
