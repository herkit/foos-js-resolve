import type { Command } from '@event-driven-io/emmett';
import { IllegalStateError } from '@event-driven-io/emmett';
import type {
  SeasonCreated,
  SeasonEvent,
  SeasonMatchRegistered,
} from './season.events';

/**
 * Write-side aggregate for a Season — ported from
 * `common/aggregates/season.projection.js` (evolve) and
 * `common/aggregates/season.commands.js` (decide).
 */
export interface SeasonState {
  matches: string[];
  leagueid?: string;
  createdAt?: number;
}

export const initialSeasonState = (): SeasonState => ({ matches: [] });

/**
 * Last-ditch rating when neither the command nor the parent league supplies one.
 * Mirrors the League aggregate's own default (`decideCreateLeague`) so a season
 * never silently diverges to the old `'basic'` fallback. In practice the
 * effective rating is resolved from the parent league in `SeasonService`.
 */
export const DEFAULT_RATING = 'elo';

/**
 * `evolve` == reSolve aggregate projection.
 *
 * NOTE (fidelity): the original projection reacted to `SEASON_STARTED` to set
 * `createdAt`/`leagueid`, but that event lives on the League stream, not the
 * Season stream — so on a Season stream it never fired. Preserved as-is.
 */
export const evolveSeason = (
  state: SeasonState,
  event: SeasonEvent,
): SeasonState => {
  switch (event.type) {
    case 'SEASON_STARTED':
      // In the original this also set `createdAt` from the event timestamp.
      // That event is never on the Season stream, so this branch is effectively
      // dead; we set `leagueid` for completeness and leave `createdAt` unset.
      return { ...state, leagueid: event.data.leagueid };
    case 'SEASON_MATCH_REGISTERED':
      return { ...state, matches: [...state.matches, event.data.matchid] };
    default:
      return state;
  }
};

// --- Commands (== reSolve command handlers) ---

export type CreateSeason = Command<
  'createSeason',
  { leagueid: string; rating?: string }
>;

export type RegisterMatch = Command<
  'registerMatch',
  {
    matchid: string;
    winners: string[];
    losers: string[];
    timestamp: number;
  }
>;

export const decideCreateSeason = (
  state: SeasonState,
  { leagueid, rating }: CreateSeason['data'],
): SeasonCreated => {
  if (state.createdAt)
    throw new IllegalStateError('Season has already been created');
  if (!leagueid) throw new IllegalStateError('League must be specified');
  return {
    type: 'SEASON_CREATED',
    data: { leagueid, rating: rating ?? DEFAULT_RATING },
  };
};

export const decideRegisterMatch = (
  state: SeasonState,
  { matchid, winners, losers, timestamp }: RegisterMatch['data'],
): SeasonMatchRegistered => {
  if (!matchid) throw new IllegalStateError('matchid must be set');
  // NOTE (fidelity): the original checked `state.matches[matchid]`, which was a
  // no-op index access against an array. `matches` is an array of match ids, so
  // `.includes` is the intended duplicate guard — implemented here as such.
  if (state.matches.includes(matchid))
    throw new IllegalStateError('Match has already been registered');
  if (!Array.isArray(winners) || !Array.isArray(losers))
    throw new IllegalStateError('winners and losers must be arrays');
  const all = [...winners, ...losers];
  if (new Set(all).size !== all.length)
    throw new IllegalStateError('A user can only appear once in a game');
  return {
    type: 'SEASON_MATCH_REGISTERED',
    data: { matchid, winners, losers, timestamp },
  };
};
