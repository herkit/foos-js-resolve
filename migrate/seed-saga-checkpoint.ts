/**
 * Seed the LeagueCreation saga's processor checkpoint to the current log head.
 *
 * Why this exists
 * ---------------
 * The migration replays the reSolve event log into a fresh Emmett store but does
 * NOT run the saga. The saga is a *durable* reactor: on first boot it reads its
 * stored checkpoint, and if none exists it starts from the BEGINNING and re-acts
 * to every historical LEAGUE_CREATED / SEASON_CREATED event.
 *
 * That replay is mostly harmless because `decideStartSeason` skips seasons that
 * are already in the league's `seasons[]`. But reSolve can contain an *orphan*
 * season — a SEASON_CREATED with no matching SEASON_STARTED (a season that was
 * created and abandoned). For an orphan the guards don't trip, so the replaying
 * saga appends a brand-new SEASON_STARTED, making an empty season the league's
 * current season and wiping its visible ranks.
 *
 * Seeding the checkpoint to the log head makes the saga resume from the end on
 * first boot, so it only reacts to genuinely new events and leaves history — and
 * any orphans within it — untouched.
 *
 * The reactor's lock-acquire only inserts a checkpoint-0 row when none exists and
 * never resets an existing checkpoint on conflict, so a pre-seeded row survives.
 * `ON CONFLICT DO NOTHING` makes this idempotent and guarantees we never clobber
 * a real checkpoint on a re-run.
 */
import { Client } from 'pg';
import { LEAGUE_CREATION_SAGA_PROCESSOR_ID } from '../src/sagas/league-creation.constants';

const DEFAULT_PARTITION = 'emt:default';

export async function seedSagaCheckpoint(
  connectionString: string,
): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const { rows } = await client.query<{ head: string | null }>(
      'SELECT max(global_position)::text AS head FROM emt_messages',
    );
    const head = rows[0]?.head ?? '0';

    // Matches Emmett's own checkpoint row: status 'stopped' so the reactor can
    // still acquire the processor lock, checkpoint stored as a zero-padded string.
    const result = await client.query(
      `INSERT INTO emt_processors
         (processor_id, partition, last_processed_checkpoint, last_processed_transaction_id)
       VALUES ($1, $2, lpad($3::text, 19, '0'), '0'::xid8)
       ON CONFLICT (processor_id, partition, version) DO NOTHING`,
      [LEAGUE_CREATION_SAGA_PROCESSOR_ID, DEFAULT_PARTITION, head],
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(
        `Seeded '${LEAGUE_CREATION_SAGA_PROCESSOR_ID}' checkpoint at global_position ${head} ` +
          `(saga will not replay migrated history).`,
      );
    } else {
      console.log(
        `Checkpoint for '${LEAGUE_CREATION_SAGA_PROCESSOR_ID}' already present; left untouched.`,
      );
    }
  } finally {
    await client.end();
  }
}
