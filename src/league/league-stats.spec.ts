import {
  accumulateMatch,
  emptyPlayerLeagueStats,
  finalizeStats,
  initialStatsAccumulator,
  withSeasonFinalRank,
  type StatsAccumulator,
} from './league-stats';

const foldMatches = (
  playerId: string,
  matches: { winners: string[]; losers: string[] }[],
): StatsAccumulator =>
  matches.reduce(
    (acc, match) => accumulateMatch(acc, playerId, match),
    initialStatsAccumulator(),
  );

/** Repeat a match `n` times. */
const times = (
  n: number,
  match: { winners: string[]; losers: string[] },
): { winners: string[]; losers: string[] }[] =>
  Array.from({ length: n }, () => match);

describe('accumulateMatch', () => {
  it('ignores matches the player did not take part in', () => {
    const acc = accumulateMatch(initialStatsAccumulator(), 'me', {
      winners: ['a'],
      losers: ['b'],
    });
    expect(acc).toEqual(initialStatsAccumulator());
  });

  it('counts wins and losses across singles matches', () => {
    const acc = foldMatches('me', [
      { winners: ['me'], losers: ['a'] },
      { winners: ['b'], losers: ['me'] },
      { winners: ['me'], losers: ['c'] },
    ]);
    expect(acc.played).toBe(3);
    expect(acc.won).toBe(2);
    expect(acc.lost).toBe(1);
  });

  it('records the head-to-head record against opponents (wins and losses)', () => {
    const acc = foldMatches('me', [
      { winners: ['me'], losers: ['a'] },
      { winners: ['a'], losers: ['me'] },
    ]);
    expect(acc.opponents['a']).toEqual({ playerId: 'a', won: 1, lost: 1 });
  });

  it('does not mutate the input accumulator (immutability)', () => {
    const start = initialStatsAccumulator();
    accumulateMatch(start, 'me', { winners: ['me', 'x'], losers: ['a', 'b'] });
    expect(start).toEqual(initialStatsAccumulator());
  });
});

describe('finalizeStats — teammates (by count)', () => {
  it('picks best teammate by shared wins and worst by shared losses', () => {
    const acc = foldMatches('me', [
      ...times(2, { winners: ['me', 'ally'], losers: ['a', 'b'] }), // won with ally x2
      ...times(2, { winners: ['a', 'b'], losers: ['me', 'burden'] }), // lost with burden x2
      { winners: ['me', 'burden'], losers: ['a', 'b'] }, // won with burden once
    ]);
    const stats = finalizeStats('L', 'me', acc);

    expect(stats.bestTeammate).toEqual({ playerId: 'ally', won: 2, lost: 0 });
    expect(stats.worstTeammate).toEqual({
      playerId: 'burden',
      won: 1,
      lost: 2,
    });
  });

  it('records no teammates in singles-only play', () => {
    const acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    const stats = finalizeStats('L', 'me', acc);
    expect(stats.bestTeammate).toBeNull();
    expect(stats.worstTeammate).toBeNull();
  });
});

describe('finalizeStats — nemeses (by losses)', () => {
  it('orders opponents by losses-against descending, keeping the full record', () => {
    const acc = foldMatches('me', [
      ...times(3, { winners: ['x'], losers: ['me'] }), // lost to x x3
      { winners: ['me'], losers: ['x'] }, // beat x once
      { winners: ['y'], losers: ['me'] }, // lost to y once
      { winners: ['me'], losers: ['z'] }, // only ever beat z — not a nemesis
    ]);
    const stats = finalizeStats('L', 'me', acc);

    expect(stats.nemeses).toEqual([
      { playerId: 'x', won: 1, lost: 3 },
      { playerId: 'y', won: 0, lost: 1 },
    ]);
  });
});

describe('finalizeStats — high/low score', () => {
  it('takes max/min of the per-season final ranks', () => {
    let acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    acc = withSeasonFinalRank(acc, 1520);
    acc = withSeasonFinalRank(acc, 1480);
    acc = withSeasonFinalRank(acc, 1600);
    acc = withSeasonFinalRank(acc, undefined); // season the player skipped

    const stats = finalizeStats('L', 'me', acc);
    expect(stats.highScore).toBe(1600);
    expect(stats.lowScore).toBe(1480);
  });

  it('leaves scores null when the player never appeared in any season', () => {
    const stats = finalizeStats('L', 'me', initialStatsAccumulator());
    expect(stats).toEqual(emptyPlayerLeagueStats('L', 'me'));
  });
});
