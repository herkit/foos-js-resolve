/**
 * Target-cleanup helpers for reruns of the reSolve -> Emmett import.
 *
 * The import only appends; it never clears the target. Rerunning against a
 * populated store would DOUBLE every event (and the inline projections would
 * replay the duplicates), so a rerun must start from an empty target.
 *
 * `targetHasEvents` lets the importer refuse to run against a non-empty store
 * unless truncation was explicitly requested. `truncateTarget` wipes the store
 * for a clean rerun.
 *
 * Note: the app's read-models use plain `pongoProjection` without a `truncate`
 * handler, so Emmett's `dangerous.truncate({ truncateProjections: true })` would
 * leave the `leagues`/`players`/`player_matches` docs behind. We therefore
 * truncate every known table explicitly (only those that already exist, so this
 * is safe on a fresh database where the schema hasn't been provisioned yet).
 */
import { Client } from 'pg';

// Emmett event-store tables + the read-model (pongo) collections this app owns.
// CASCADE + partitioned parents mean truncating these clears all partitions.
const KNOWN_TABLES = [
  'emt_streams',
  'emt_messages',
  'emt_processors',
  'emt_projections',
  'emt_subscriptions', // legacy dual-write table; present on older schemas
  'leagues',
  'players',
  'player_matches',
];

const GLOBAL_POSITION_SEQUENCE = 'emt_global_message_position';

/** True if the target already holds imported events (schema present + rows). */
export async function targetHasEvents(
  connectionString: string,
): Promise<boolean> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const reg = await client.query<{ t: string | null }>(
      "SELECT to_regclass('public.emt_messages') AS t",
    );
    if (!reg.rows[0]?.t) return false; // schema not provisioned yet -> empty
    const { rows } = await client.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM emt_messages',
    );
    return (rows[0]?.n ?? 0) > 0;
  } finally {
    await client.end();
  }
}

/** Truncate every known table that exists and reset the global-position sequence. */
export async function truncateTarget(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const existing: string[] = [];
    for (const table of KNOWN_TABLES) {
      const reg = await client.query<{ t: string | null }>(
        'SELECT to_regclass($1) AS t',
        [`public.${table}`],
      );
      if (reg.rows[0]?.t) existing.push(table);
    }

    if (existing.length === 0) {
      console.log(
        'Target is already empty (no known tables); nothing to truncate.',
      );
      return;
    }

    // Table names come from the fixed KNOWN_TABLES list, so interpolation is safe.
    const list = existing.map((t) => `"${t}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

    const seq = await client.query<{ t: string | null }>(
      'SELECT to_regclass($1) AS t',
      [`public.${GLOBAL_POSITION_SEQUENCE}`],
    );
    if (seq.rows[0]?.t) {
      await client.query(
        `ALTER SEQUENCE ${GLOBAL_POSITION_SEQUENCE} RESTART WITH 1`,
      );
    }

    console.log(`Truncated target tables: ${existing.join(', ')}.`);
  } finally {
    await client.end();
  }
}
