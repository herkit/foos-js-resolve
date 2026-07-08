import type { Command } from '@event-driven-io/emmett';
import { IllegalStateError } from '@event-driven-io/emmett';
import type { Actor } from '../common/actor';
import type {
  SeasonCreated,
  SeasonEvent,
  SeasonMatchCorrected,
  SeasonMatchRegistered,
  SeasonMatchVoided,
} from './season.events';

/**
 * Write-side aggregate for a Season — ported from
 * `common/aggregates/season.projection.js` (evolve) and
 * `common/aggregates/season.commands.js` (decide).
 */
export interface SeasonState {
  matches: string[];
  /** Match id -> the player ids on record for it (winners + losers), tracking
   *  the latest known roster after any correction. Used to authorize who may
   *  correct/void a match. */
  participants?: Record<string, string[]>;
  /** Match ids that have been voided — kept so voids can't double-apply and a
   *  voided match can't be corrected. */
  voided?: string[];
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
      return {
        ...state,
        matches: [...state.matches, event.data.matchid],
        participants: {
          ...state.participants,
          [event.data.matchid]: [...event.data.winners, ...event.data.losers],
        },
      };
    case 'SEASON_MATCH_CORRECTED':
      // Track the corrected roster so involvement checks follow the latest
      // outcome; adds/removes no match id.
      return {
        ...state,
        participants: {
          ...state.participants,
          [event.data.matchid]: [...event.data.winners, ...event.data.losers],
        },
      };
    case 'SEASON_MATCH_VOIDED':
      return {
        ...state,
        voided: [...(state.voided ?? []), event.data.matchid],
      };
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

/** Shared outcome validation for registering and correcting a match. */
const assertValidOutcome = (winners: string[], losers: string[]): void => {
  if (!Array.isArray(winners) || !Array.isArray(losers))
    throw new IllegalStateError('winners and losers must be arrays');
  const all = [...winners, ...losers];
  if (new Set(all).size !== all.length)
    throw new IllegalStateError('A user can only appear once in a game');
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
  assertValidOutcome(winners, losers);
  return {
    type: 'SEASON_MATCH_REGISTERED',
    data: { matchid, winners, losers, timestamp },
  };
};

// The correcting/voiding actor is the authenticated principal (see
// `JwtCookieGuard`), NOT a caller-supplied field — so `correctedBy`/`voidedBy`
// are derived from the actor, never trusted from the request body.
export type CorrectMatch = Command<
  'correctMatch',
  {
    matchid: string;
    winners: string[];
    losers: string[];
    reason: string;
    timestamp: number;
  }
>;

export type VoidMatch = Command<
  'voidMatch',
  { matchid: string; reason: string; timestamp: number }
>;

/**
 * Authorize a correction/void and return the acting player's id (used as the
 * audit `correctedBy`/`voidedBy`). Only a superuser or a player on record for
 * the match may modify its outcome.
 */
const requireMatchModifier = (
  state: SeasonState,
  matchid: string,
  actor: Actor,
): string => {
  if (!actor.id)
    throw new IllegalStateError('Authentication required to modify a match');
  if (!actor.superuser) {
    const participants = state.participants?.[matchid] ?? [];
    if (!participants.includes(actor.id))
      throw new IllegalStateError(
        'Only a superuser or a player in the match can modify it',
      );
  }
  return actor.id;
};

export const decideCorrectMatch = (
  state: SeasonState,
  data: CorrectMatch['data'],
  actor: Actor,
): SeasonMatchCorrected => {
  if (!data.matchid) throw new IllegalStateError('matchid must be set');
  const correctedBy = requireMatchModifier(state, data.matchid, actor);
  if (!state.matches.includes(data.matchid))
    throw new IllegalStateError('Cannot correct an unregistered match');
  if ((state.voided ?? []).includes(data.matchid))
    throw new IllegalStateError('Cannot correct a voided match');
  assertValidOutcome(data.winners, data.losers);
  return { type: 'SEASON_MATCH_CORRECTED', data: { ...data, correctedBy } };
};

export const decideVoidMatch = (
  state: SeasonState,
  data: VoidMatch['data'],
  actor: Actor,
): SeasonMatchVoided => {
  if (!data.matchid) throw new IllegalStateError('matchid must be set');
  const voidedBy = requireMatchModifier(state, data.matchid, actor);
  if (!state.matches.includes(data.matchid))
    throw new IllegalStateError('Cannot void an unregistered match');
  if ((state.voided ?? []).includes(data.matchid))
    throw new IllegalStateError('Match has already been voided');
  return { type: 'SEASON_MATCH_VOIDED', data: { ...data, voidedBy } };
};
