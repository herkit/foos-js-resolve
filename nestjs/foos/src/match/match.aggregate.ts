import { IllegalStateError } from '@event-driven-io/emmett';
import type {
  DoubleMatchPlayed,
  MatchEvent,
  SingleMatchPlayed,
} from './match.events';

/**
 * Match aggregate — ported from `common/aggregates/match.{projection,commands}.js`.
 * A match is single-use: once played it cannot be replayed.
 */
export interface MatchState {
  playedAt?: number;
}

export const initialMatchState = (): MatchState => ({});

export const evolveMatch = (state: MatchState, event: MatchEvent): MatchState => {
  switch (event.type) {
    case 'SINGLEMATCH_PLAYED':
    case 'DOUBLEMATCH_PLAYED':
      return { ...state, playedAt: state.playedAt ?? 1 };
    default:
      return state;
  }
};

export const decideRegisterSingleMatch = (
  state: MatchState,
  input: { winner: string; loser: string; season: string },
): SingleMatchPlayed => {
  if (state.playedAt) throw new IllegalStateError('The match already exists');
  if (!input.winner) throw new IllegalStateError('winner is required');
  if (!input.loser) throw new IllegalStateError('loser is required');
  if (input.winner === input.loser)
    throw new IllegalStateError('winner cannot be same player as loser');
  return {
    type: 'SINGLEMATCH_PLAYED',
    data: { winner: input.winner, loser: input.loser, season: input.season },
  };
};

export const decideRegisterDoubleMatch = (
  state: MatchState,
  input: {
    winner1: string;
    winner2: string;
    loser1: string;
    loser2: string;
    season: string;
  },
): DoubleMatchPlayed => {
  if (state.playedAt) throw new IllegalStateError('Match already exist');
  if (!input.winner1) throw new IllegalStateError('winner1 is required');
  if (!input.winner2) throw new IllegalStateError('winner2 is required');
  if (!input.loser1) throw new IllegalStateError('loser1 is required');
  if (!input.loser2) throw new IllegalStateError('loser2 is required');
  const players = [input.winner1, input.winner2, input.loser1, input.loser2];
  if (new Set(players).size !== players.length)
    throw new IllegalStateError('No player can appear more than once in a match');
  return {
    type: 'DOUBLEMATCH_PLAYED',
    data: {
      winner1: input.winner1,
      winner2: input.winner2,
      loser1: input.loser1,
      loser2: input.loser2,
      season: input.season,
    },
  };
};
