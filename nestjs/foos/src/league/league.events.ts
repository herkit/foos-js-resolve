import type { Event } from '@event-driven-io/emmett';

/** League stream events — ported from `common/event-types.js`. */
export type LeagueCreated = Event<
  'LEAGUE_CREATED',
  { name: string; rating: string; owner: string }
>;

/** Declared in the original event types; no command emits it yet. Kept for completeness. */
export type LeaguePlayerAdded = Event<
  'LEAGUE_PLAYER_ADDED',
  { playerid: string }
>;

export type SeasonStarted = Event<
  'SEASON_STARTED',
  { seasonid: string; leagueid: string }
>;

export type LeagueEvent = LeagueCreated | LeaguePlayerAdded | SeasonStarted;
