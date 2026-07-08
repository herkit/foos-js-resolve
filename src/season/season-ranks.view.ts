import EloRating from 'elo-rating';
import { DEFAULT_RATING } from './season.aggregate';
import type { SeasonEvent } from './season.events';

/**
 * Reactive view-model — ported from `common/view-models/season-ranks.projection.js`.
 *
 * Built by folding a single Season stream's events. Consumed two ways:
 *  - on-demand read via `eventStore.aggregateStream(..., { evolve, initialState })`
 *  - live pushes over the WebSocket gateway after each registered match
 *
 * This replaces reSolve's reactive `useReduxViewModel({ name: 'SeasonRanks' })`.
 */

export interface PlayerRank {
  id: string;
  rank: number;
  winCount: number;
  winStreak: number;
  longestWinStreak: number;
  lossCount: number;
  lossStreak: number;
  longestLossStreak: number;
  played: number;
}

interface RankRecord {
  title: string;
  id: string;
  record: number;
}

export interface SeasonRanksState {
  ranks: PlayerRank[];
  rankhistory: Record<
    string,
    { timestamp: number; rank: number; matchnumber: number }[]
  >;
  rating: string;
  recentMatches: { timestamp: number; winners: string[]; losers: string[] }[];
  matchcount?: number;
  records?: { winStreak: RankRecord; lossStreak: RankRecord };
}

const defaultRank: Omit<PlayerRank, 'id'> = {
  rank: 1500,
  winCount: 0,
  winStreak: 0,
  longestWinStreak: 0,
  lossCount: 0,
  lossStreak: 0,
  longestLossStreak: 0,
  played: 0,
};

/** Insert or replace the entry matching `id` (in-place, mirrors the original `upsert`). */
const upsert = (arr: PlayerRank[], id: string, newval: PlayerRank): void => {
  const index = arr.findIndex((p) => p.id === id);
  if (index >= 0) {
    arr.splice(index, 1, newval);
  } else {
    arr.push(newval);
  }
};

const calculateElo = ({
  avgwinner,
  avgloser,
}: {
  avgwinner: number;
  avgloser: number;
}): number => {
  const eloRatings = EloRating.calculate(avgwinner, avgloser);
  return eloRatings.playerRating - avgwinner;
};

const calculateBasic = ({
  totalwinner,
  totalloser,
}: {
  totalwinner: number;
  totalloser: number;
}): number => {
  let scoreChange = 10;
  if (totalwinner > totalloser) {
    scoreChange = 5;
    if (totalwinner >= totalloser + 100) scoreChange = 0;
  } else {
    if (totalwinner < totalloser - 100) {
      scoreChange = 20;
    }
  }
  return scoreChange;
};

/**
 * Defensive default: a well-formed Season stream opens with SEASON_CREATED,
 * which sets the rating explicitly (see `evolveSeasonRanks`). A handful of
 * migrated streams were "started" (via a historical reSolve saga bug) but never
 * "created", so they carry match events with no SEASON_CREATED. Rather than let
 * those silently fall back to the old `'basic'` scoring, we seed the aggregate's
 * `DEFAULT_RATING` ('elo') — matching the League/Season aggregate defaults so a
 * creation-less stream scores the same way a new season would.
 */
export const initialSeasonRanks = (): SeasonRanksState => ({
  ranks: [],
  rankhistory: {},
  rating: DEFAULT_RATING,
  recentMatches: [],
});

export const evolveSeasonRanks = (
  state: SeasonRanksState,
  event: SeasonEvent,
): SeasonRanksState => {
  switch (event.type) {
    case 'SEASON_CREATED':
      return { ...state, rating: event.data.rating ?? state.rating };

    case 'SEASON_MATCH_REGISTERED': {
      const { winners, losers, timestamp } = event.data;
      const ranks = [...state.ranks];

      const winnerranks = winners.map(
        (player) =>
          ranks.find(({ id }) => id === player) ?? {
            id: player,
            ...defaultRank,
          },
      );
      const loserranks = losers.map(
        (player) =>
          ranks.find(({ id }) => id === player) ?? {
            id: player,
            ...defaultRank,
          },
      );

      const totalwinner = winnerranks.reduce((prev, cur) => prev + cur.rank, 0);
      const totalloser = loserranks.reduce((prev, cur) => prev + cur.rank, 0);
      const avgwinner = totalwinner / winnerranks.length;
      const avgloser = totalloser / loserranks.length;

      const playerdata = { totalloser, totalwinner, avgwinner, avgloser };

      let scoreChange = 0;
      switch (state.rating ?? 'basic') {
        case 'elo':
          scoreChange = calculateElo(playerdata);
          break;
        default:
          scoreChange = calculateBasic(playerdata);
      }

      const scorePerWinner = scoreChange / winners.length;
      const scorePerLoser = scoreChange / losers.length;

      const rankUpdates: PlayerRank[] = [
        ...winnerranks.map((p) => ({
          ...p,
          rank: p.rank + scorePerWinner,
          played: p.played + 1,
          winCount: p.winCount + 1,
          winStreak: p.winStreak + 1,
          longestWinStreak: Math.max(p.winStreak + 1, p.longestWinStreak, 0),
          lossStreak: 0,
        })),
        ...loserranks.map((p) => ({
          ...p,
          rank: p.rank - scorePerLoser,
          played: p.played + 1,
          winStreak: 0,
          lossCount: p.lossCount + 1,
          lossStreak: p.lossStreak + 1,
          longestLossStreak: Math.max(p.lossStreak + 1, p.longestLossStreak, 0),
        })),
      ];

      rankUpdates.forEach((p) => upsert(ranks, p.id, p));

      const lls = [...ranks].sort(
        (a, b) => b.longestLossStreak - a.longestLossStreak,
      )[0];
      const lws = [...ranks].sort(
        (a, b) => b.longestWinStreak - a.longestWinStreak,
      )[0];

      const matchcount = (state.matchcount ?? 0) + 1;

      return {
        ...state,
        matchcount,
        ranks: ranks.sort((a, b) => b.rank - a.rank),
        rankhistory: {
          ...state.rankhistory,
          ...rankUpdates.reduce(
            (playersState, { id, rank }) => ({
              ...playersState,
              [id]: [
                ...(state.rankhistory[id] ?? []),
                { timestamp, rank, matchnumber: matchcount },
              ],
            }),
            {} as SeasonRanksState['rankhistory'],
          ),
        },
        records: {
          winStreak: {
            title: 'Longest Win Streak',
            id: lws.id,
            record: lws.longestWinStreak,
          },
          lossStreak: {
            title: 'Longest Loss Streak',
            id: lls.id,
            record: lls.longestLossStreak,
          },
        },
        recentMatches: [
          { timestamp, winners, losers },
          ...state.recentMatches,
        ].slice(0, 5),
      };
    }

    default:
      return state;
  }
};
