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

  it('records no teammates in singles-only play', () => {
    const acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    const stats = finalizeStats('L', 'me', acc);
    expect(stats.bestTeammate).toBeNull();
    expect(stats.worstTeammate).toBeNull();
  });

  it('does not mutate the input accumulator (immutability)', () => {
    const start = initialStatsAccumulator();
    accumulateMatch(start, 'me', { winners: ['me', 'x'], losers: ['a', 'b'] });
    expect(start).toEqual(initialStatsAccumulator());
  });
});

describe('finalizeStats — teammates (2v2)', () => {
  it('picks best teammate by shared wins and worst by shared losses', () => {
    const acc = foldMatches('me', [
      { winners: ['me', 'ally'], losers: ['a', 'b'] }, // won with ally
      { winners: ['me', 'ally'], losers: ['a', 'b'] }, // won with ally
      { winners: ['a', 'b'], losers: ['me', 'burden'] }, // lost with burden
      { winners: ['a', 'b'], losers: ['me', 'burden'] }, // lost with burden
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
});

describe('finalizeStats — nemeses', () => {
  it('orders opponents by losses-against descending, counting all winners', () => {
    const acc = foldMatches('me', [
      { winners: ['x', 'y'], losers: ['me', 'p'] }, // lost to x, y
      { winners: ['x', 'z'], losers: ['me', 'p'] }, // lost to x, z
      { winners: ['x'], losers: ['me'] }, // lost to x
      { winners: ['me'], losers: ['x'] }, // beat x — not a loss
    ]);
    const stats = finalizeStats('L', 'me', acc);

    expect(stats.nemeses).toEqual([
      { playerId: 'x', losses: 3 },
      { playerId: 'y', losses: 1 },
      { playerId: 'z', losses: 1 },
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
