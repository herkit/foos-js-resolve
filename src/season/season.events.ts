import type { Event } from '@event-driven-io/emmett';

/**
 * Season stream events — ported from `common/event-types.js`.
 *
 * Event payloads intentionally preserve the original reSolve field names
 * (`leagueid`, `matchid`, ...) so migrated historical events can be replayed
 * verbatim. `timestamp` (epoch ms) is carried in the event data; reSolve stored
 * it as a separate column, and the Phase 4 exporter maps that column into
 * `data.timestamp`.
 */
export type SeasonCreated = Event<
  'SEASON_CREATED',
  { leagueid: string; rating: string }
>;

/**
 * Emitted on the League stream in the original app (via `League.startSeason`).
 * Included here because the Season aggregate projection reacted to it; kept for
 * fidelity even though it does not appear on the Season stream itself.
 */
export type SeasonStarted = Event<
  'SEASON_STARTED',
  { seasonid: string; leagueid: string }
>;

export type SeasonMatchRegistered = Event<
  'SEASON_MATCH_REGISTERED',
  {
    matchid: string;
    winners: string[];
    losers: string[];
    timestamp: number;
  }
>;

export type SeasonEvent =
  | SeasonCreated
  | SeasonStarted
  | SeasonMatchRegistered;
