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
 *
 * Best/worst teammate and nemeses are ranked by a Laplace-smoothed win/loss
 * ratio (see `smoothedWinRatio`) so small samples aren't over-weighted. Each
 * record still carries the full, unsmoothed win/loss tally so the card can
 * display the pairing's real win/loss ratio.
 */

/** A player's head-to-head record with a partner or opponent (from the subject
 * player's perspective: `won`/`lost` are the subject's wins/losses). */
export interface HeadToHead {
  playerId: string;
  won: number;
  lost: number;
}

export type TeammateStat = HeadToHead;
export type NemesisStat = HeadToHead;

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
  /** Opponents the player has lost to, ordered by losses-against descending. */
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
  teammates: Record<string, HeadToHead>;
  opponents: Record<string, HeadToHead>;
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

/** Increment `won` or `lost` for each of `ids` in a head-to-head record map. */
const bumpRecords = (
  records: Record<string, HeadToHead>,
  ids: string[],
  outcome: 'won' | 'lost',
): Record<string, HeadToHead> =>
  ids.reduce((acc, id) => {
    const prev = acc[id] ?? { playerId: id, won: 0, lost: 0 };
    return { ...acc, [id]: { ...prev, [outcome]: prev[outcome] + 1 } };
  }, records);

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
      teammates: bumpRecords(
        acc.teammates,
        winners.filter((id) => id !== playerId),
        'won',
      ),
      // The player beat these opponents this match.
      opponents: bumpRecords(acc.opponents, losers, 'won'),
    };
  }

  return {
    ...acc,
    played: acc.played + 1,
    lost: acc.lost + 1,
    teammates: bumpRecords(
      acc.teammates,
      losers.filter((id) => id !== playerId),
      'lost',
    ),
    // These opponents beat the player this match.
    opponents: bumpRecords(acc.opponents, winners, 'lost'),
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

/**
 * Laplace-smoothed win/loss ratios: add 1 to both tallies before dividing so a
 * tiny sample can't produce an extreme ratio (a lone 1-0 no longer outranks a
 * seasoned 12-3). This replaced a hard minimum-games cutoff, which gave poor
 * results. Used ONLY to order records — the returned HeadToHead keeps the real,
 * unsmoothed counts.
 */
const smoothedWinRatio = (r: HeadToHead): number => (r.won + 1) / (r.lost + 1);
const smoothedLossRatio = (r: HeadToHead): number => (r.lost + 1) / (r.won + 1);
const encounters = (r: HeadToHead): number => r.won + r.lost;

/** Order by `score` desc, breaking ties toward the larger sample then id, so
 *  ratio ties resolve deterministically to the better-established pairing. */
const byScoreDesc =
  (score: (r: HeadToHead) => number) =>
  (a: HeadToHead, b: HeadToHead): number =>
    score(b) - score(a) ||
    encounters(b) - encounters(a) ||
    a.playerId.localeCompare(b.playerId);

/** Highest-scoring eligible record; null if none. */
const topByScore = (
  records: Record<string, HeadToHead>,
  eligible: (r: HeadToHead) => boolean,
  score: (r: HeadToHead) => number,
): HeadToHead | null =>
  Object.values(records).filter(eligible).sort(byScoreDesc(score))[0] ?? null;

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
    // Best/worst teammate and nemeses rank by the smoothed ratio; the records
    // themselves carry the true counts so the UI still shows the real W/L.
    bestTeammate: topByScore(acc.teammates, (r) => r.won > 0, smoothedWinRatio),
    worstTeammate: topByScore(
      acc.teammates,
      (r) => r.lost > 0,
      smoothedLossRatio,
    ),
    nemeses: Object.values(acc.opponents)
      .filter((o) => o.lost > 0)
      .sort(byScoreDesc(smoothedLossRatio)),
  };
};
