/**
 * League-wide player career stats — pure aggregation over match results.
 *
 * The app tracks rankings per *season* (`SeasonRanks`). These helpers roll a
 * single player's results up across every season in a league into a career
 * card: totals, best/worst partner, and nemeses. They are deliberately pure and
 * immutable so they can be unit-tested in isolation and folded from either the
 * event store or in-memory fixtures.
 *
 * Data source: the `SEASON_MATCH_REGISTERED` event (`{ winners, losers }`),
 * which covers both 1v1 (one id per side) and 2v2 (two ids per side). Teammates
 * therefore only accrue in 2v2 play; a singles-only league yields no partner.
 */

/** A partner the player has shared a team with, and the shared W/L tally. */
export interface TeammateStat {
  playerId: string;
  won: number;
  lost: number;
}

/** An opponent the player has lost to, and how many times. */
export interface NemesisStat {
  playerId: string;
  losses: number;
}

export interface PlayerLeagueStats {
  leagueId: string;
  playerId: string;
  played: number;
  won: number;
  lost: number;
  /** Highest season-final rank reached in any season; null if never played. */
  highScore: number | null;
  /** Lowest season-final rank reached in any season; null if never played. */
  lowScore: number | null;
  /** Partner with the most shared wins; null in singles-only play. */
  bestTeammate: TeammateStat | null;
  /** Partner with the most shared losses; null in singles-only play. */
  worstTeammate: TeammateStat | null;
  /** Opponents ordered by losses-against, descending. */
  nemeses: NemesisStat[];
}

/**
 * Running accumulator folded over every match in the league. Partner and
 * opponent tallies are keyed by player id for O(1) updates; `finalizeStats`
 * collapses them into the public shape.
 */
export interface StatsAccumulator {
  played: number;
  won: number;
  lost: number;
  teammates: Record<string, TeammateStat>;
  opponents: Record<string, NemesisStat>;
  /** One entry per season the player actually appeared in. */
  seasonFinalRanks: number[];
}

const emptyAccumulator = (): StatsAccumulator => ({
  played: 0,
  won: 0,
  lost: 0,
  teammates: {},
  opponents: {},
  seasonFinalRanks: [],
});

export const emptyPlayerLeagueStats = (
  leagueId: string,
  playerId: string,
): PlayerLeagueStats => ({
  leagueId,
  playerId,
  played: 0,
  won: 0,
  lost: 0,
  highScore: null,
  lowScore: null,
  bestTeammate: null,
  worstTeammate: null,
  nemeses: [],
});

interface MatchResult {
  winners: string[];
  losers: string[];
}

const bumpTeammate = (
  teammates: Record<string, TeammateStat>,
  partners: string[],
  outcome: 'won' | 'lost',
): Record<string, TeammateStat> =>
  partners.reduce((acc, partnerId) => {
    const prev = acc[partnerId] ?? { playerId: partnerId, won: 0, lost: 0 };
    return {
      ...acc,
      [partnerId]: { ...prev, [outcome]: prev[outcome] + 1 },
    };
  }, teammates);

const bumpOpponents = (
  opponents: Record<string, NemesisStat>,
  beatenBy: string[],
): Record<string, NemesisStat> =>
  beatenBy.reduce((acc, opponentId) => {
    const prev = acc[opponentId] ?? { playerId: opponentId, losses: 0 };
    return { ...acc, [opponentId]: { ...prev, losses: prev.losses + 1 } };
  }, opponents);

/**
 * Fold a single match into the accumulator from `playerId`'s perspective.
 * Matches the player did not take part in are returned unchanged.
 */
export const accumulateMatch = (
  acc: StatsAccumulator,
  playerId: string,
  { winners, losers }: MatchResult,
): StatsAccumulator => {
  const won = winners.includes(playerId);
  const lost = losers.includes(playerId);
  if (!won && !lost) return acc;

  if (won) {
    return {
      ...acc,
      played: acc.played + 1,
      won: acc.won + 1,
      teammates: bumpTeammate(
        acc.teammates,
        winners.filter((id) => id !== playerId),
        'won',
      ),
    };
  }

  return {
    ...acc,
    played: acc.played + 1,
    lost: acc.lost + 1,
    teammates: bumpTeammate(
      acc.teammates,
      losers.filter((id) => id !== playerId),
      'lost',
    ),
    opponents: bumpOpponents(acc.opponents, winners),
  };
};

/** Record the player's final rank for one season (skip seasons never played). */
export const withSeasonFinalRank = (
  acc: StatsAccumulator,
  rank: number | undefined,
): StatsAccumulator =>
  rank === undefined
    ? acc
    : { ...acc, seasonFinalRanks: [...acc.seasonFinalRanks, rank] };

export const initialStatsAccumulator = emptyAccumulator;

/** Pick the teammate with the highest count for `key`; null if none / all zero. */
const pickTeammate = (
  teammates: Record<string, TeammateStat>,
  key: 'won' | 'lost',
): TeammateStat | null => {
  const best = Object.values(teammates)
    .filter((t) => t[key] > 0)
    .sort((a, b) => b[key] - a[key])[0];
  return best ?? null;
};

/** Collapse the accumulator into the public career-card shape. */
export const finalizeStats = (
  leagueId: string,
  playerId: string,
  acc: StatsAccumulator,
): PlayerLeagueStats => {
  const ranks = acc.seasonFinalRanks;
  return {
    leagueId,
    playerId,
    played: acc.played,
    won: acc.won,
    lost: acc.lost,
    highScore: ranks.length ? Math.max(...ranks) : null,
    lowScore: ranks.length ? Math.min(...ranks) : null,
    bestTeammate: pickTeammate(acc.teammates, 'won'),
    worstTeammate: pickTeammate(acc.teammates, 'lost'),
    nemeses: Object.values(acc.opponents)
      .filter((o) => o.losses > 0)
      .sort((a, b) => b.losses - a.losses),
  };
};
