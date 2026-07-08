import { IllegalStateError } from '@event-driven-io/emmett';
import type { Actor } from '../common/actor';
import {
  DEFAULT_RATING,
  decideCorrectMatch,
  decideCreateSeason,
  decideVoidMatch,
  initialSeasonState,
  type SeasonState,
} from './season.aggregate';

describe('decideCreateSeason', () => {
  it('emits SEASON_CREATED with the supplied rating', () => {
    const event = decideCreateSeason(initialSeasonState(), {
      leagueid: 'league-1',
      rating: 'basic',
    });

    expect(event).toEqual({
      type: 'SEASON_CREATED',
      data: { leagueid: 'league-1', rating: 'basic' },
    });
  });

  it('falls back to the league default rating (not "basic") when none is supplied', () => {
    const event = decideCreateSeason(initialSeasonState(), {
      leagueid: 'league-1',
    });

    expect(event.data.rating).toBe(DEFAULT_RATING);
    expect(event.data.rating).not.toBe('basic');
  });

  it('throws when the league is missing', () => {
    expect(() =>
      decideCreateSeason(initialSeasonState(), {
        leagueid: '',
        rating: 'elo',
      }),
    ).toThrow(IllegalStateError);
  });

  it('throws when the season already exists', () => {
    const existing: SeasonState = { matches: [], createdAt: 1 };

    expect(() =>
      decideCreateSeason(existing, { leagueid: 'league-1', rating: 'elo' }),
    ).toThrow(IllegalStateError);
  });
});

// 'a' and 'b' are the players on record for m1.
const played: SeasonState = {
  matches: ['m1'],
  participants: { m1: ['a', 'b'] },
  createdAt: 1,
};

const superuser: Actor = { id: 'admin', superuser: true };
const involved: Actor = { id: 'a' };
const outsider: Actor = { id: 'z' };

describe('decideCorrectMatch', () => {
  const input = {
    matchid: 'm1',
    winners: ['b'],
    losers: ['a'],
    reason: 'recorded backwards',
    timestamp: 5,
  };

  it('emits SEASON_MATCH_CORRECTED with correctedBy sourced from the actor', () => {
    expect(decideCorrectMatch(played, input, involved)).toEqual({
      type: 'SEASON_MATCH_CORRECTED',
      data: { ...input, correctedBy: 'a' },
    });
  });

  it('lets a superuser correct a match they were not part of', () => {
    const event = decideCorrectMatch(played, input, superuser);
    expect(event.data.correctedBy).toBe('admin');
  });

  it('rejects a player who was not involved in the match', () => {
    expect(() => decideCorrectMatch(played, input, outsider)).toThrow(
      IllegalStateError,
    );
  });

  it('rejects an unauthenticated actor', () => {
    expect(() => decideCorrectMatch(played, input, {})).toThrow(
      IllegalStateError,
    );
  });

  it('throws when the match was never registered', () => {
    expect(() =>
      decideCorrectMatch(initialSeasonState(), input, superuser),
    ).toThrow(IllegalStateError);
  });

  it('throws when the match has been voided', () => {
    const state: SeasonState = { ...played, voided: ['m1'] };
    expect(() => decideCorrectMatch(state, input, superuser)).toThrow(
      IllegalStateError,
    );
  });

  it('throws when a player appears on both sides', () => {
    expect(() =>
      decideCorrectMatch(
        played,
        { ...input, winners: ['a'], losers: ['a'] },
        superuser,
      ),
    ).toThrow(IllegalStateError);
  });
});

describe('decideVoidMatch', () => {
  const input = { matchid: 'm1', reason: 'never happened', timestamp: 5 };

  it('emits SEASON_MATCH_VOIDED with voidedBy sourced from the actor', () => {
    expect(decideVoidMatch(played, input, involved)).toEqual({
      type: 'SEASON_MATCH_VOIDED',
      data: { ...input, voidedBy: 'a' },
    });
  });

  it('lets a superuser void a match they were not part of', () => {
    expect(decideVoidMatch(played, input, superuser).data.voidedBy).toBe(
      'admin',
    );
  });

  it('rejects a player who was not involved in the match', () => {
    expect(() => decideVoidMatch(played, input, outsider)).toThrow(
      IllegalStateError,
    );
  });

  it('throws when the match was never registered', () => {
    expect(() =>
      decideVoidMatch(initialSeasonState(), input, superuser),
    ).toThrow(IllegalStateError);
  });

  it('throws when the match has already been voided', () => {
    const state: SeasonState = { ...played, voided: ['m1'] };
    expect(() => decideVoidMatch(state, input, superuser)).toThrow(
      IllegalStateError,
    );
  });
});
