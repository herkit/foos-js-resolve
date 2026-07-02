import { IllegalStateError } from '@event-driven-io/emmett';
import {
  DEFAULT_RATING,
  decideCreateSeason,
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
