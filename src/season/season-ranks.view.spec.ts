import { DEFAULT_RATING } from './season.aggregate';
import {
  evolveSeasonRanks,
  initialSeasonRanks,
  type SeasonRanksState,
} from './season-ranks.view';
import type { SeasonEvent } from './season.events';

const fold = (events: SeasonEvent[]): SeasonRanksState =>
  events.reduce(evolveSeasonRanks, initialSeasonRanks());

const created = (rating: string): SeasonEvent => ({
  type: 'SEASON_CREATED',
  data: { leagueid: 'L', rating },
});

const match = (winner: string, loser: string): SeasonEvent => ({
  type: 'SEASON_MATCH_REGISTERED',
  data: {
    matchid: `m-${winner}-${loser}`,
    winners: [winner],
    losers: [loser],
    timestamp: 1,
  },
});

const rankOf = (state: SeasonRanksState, id: string): number =>
  state.ranks.find((p) => p.id === id)?.rank ?? 0;

// Two wins by the same player make the elo and basic curves diverge (a repeat
// win over a now lower-rated opponent is scored differently), so the resulting
// rank is a reliable witness of which scoring path ran.
const twoWins: SeasonEvent[] = [match('a', 'b'), match('a', 'b')];

describe('evolveSeasonRanks rating default', () => {
  it("defaults to 'elo' (DEFAULT_RATING) when the stream has no SEASON_CREATED", () => {
    const defaulted = fold(twoWins);

    expect(DEFAULT_RATING).toBe('elo');
    expect(defaulted.rating).toBe('elo');
    // A creation-less stream scores identically to an explicit 'elo' season...
    expect(rankOf(defaulted, 'a')).toBe(
      rankOf(fold([created('elo'), ...twoWins]), 'a'),
    );
    // ...and NOT like the old 'basic' fallback (proving the default matters).
    expect(rankOf(defaulted, 'a')).not.toBe(
      rankOf(fold([created('basic'), ...twoWins]), 'a'),
    );
  });

  it("still honours an explicit 'basic' rating from SEASON_CREATED", () => {
    const state = fold([created('basic'), ...twoWins]);
    expect(state.rating).toBe('basic');
  });

  it("still honours an explicit 'elo' rating from SEASON_CREATED", () => {
    const state = fold([created('elo'), ...twoWins]);
    expect(state.rating).toBe('elo');
  });
});

describe('evolveSeasonRanks recentMatches', () => {
  it('carries each match id so the UI can target a correction/void', () => {
    const state = fold([created('elo'), match('a', 'b')]);
    expect(state.recentMatches[0]).toMatchObject({
      matchid: 'm-a-b',
      winners: ['a'],
      losers: ['b'],
    });
  });
});
