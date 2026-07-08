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

/**
 * Corrects a previously registered match's outcome (e.g. winner/loser recorded
 * backwards). Events are immutable, so we never edit the original
 * `SEASON_MATCH_REGISTERED`; we append a correction that read-side folds apply
 * in place at the original match's position (see `applyCorrections`). Because
 * ratings are path-dependent, this recomputes every downstream rating.
 * `correctedBy`/`reason` are the audit trail for the change.
 */
export type SeasonMatchCorrected = Event<
  'SEASON_MATCH_CORRECTED',
  {
    matchid: string;
    winners: string[];
    losers: string[];
    correctedBy: string;
    reason: string;
    timestamp: number;
  }
>;

/**
 * Voids a previously registered match (it never happened / was a duplicate).
 * Read-side folds drop the match entirely, as if it had never been registered.
 */
export type SeasonMatchVoided = Event<
  'SEASON_MATCH_VOIDED',
  {
    matchid: string;
    voidedBy: string;
    reason: string;
    timestamp: number;
  }
>;

export type SeasonEvent =
  | SeasonCreated
  | SeasonStarted
  | SeasonMatchRegistered
  | SeasonMatchCorrected
  | SeasonMatchVoided;
