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

describe('finalizeStats — teammates (by smoothed ratio)', () => {
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

  it('does not let a lone 1-0 pairing outrank a seasoned winning pairing', () => {
    const acc = foldMatches('me', [
      // A strong, high-volume pairing: 12-3 together.
      ...times(12, { winners: ['me', 'rock'], losers: ['a', 'b'] }),
      ...times(3, { winners: ['a', 'b'], losers: ['me', 'rock'] }),
      // A single lucky win together: 1-0.
      { winners: ['me', 'fluke'], losers: ['a', 'b'] },
    ]);
    const stats = finalizeStats('L', 'me', acc);

    // Raw ratio would crown the 1-0 pairing (infinite); the smoothed ratio
    // (13/4 vs 2/1) correctly prefers the established one...
    expect(stats.bestTeammate?.playerId).toBe('rock');
    // ...and the returned record keeps the REAL counts, not the +1 smoothed ones.
    expect(stats.bestTeammate).toEqual({ playerId: 'rock', won: 12, lost: 3 });
  });
});

describe('finalizeStats — nemeses (by smoothed ratio)', () => {
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

  it('ranks a heavier losing record above a lone loss (smoothed ratio)', () => {
    const acc = foldMatches('me', [
      // 2-6 against 'heavy' — a real nemesis by ratio and volume.
      ...times(6, { winners: ['heavy'], losers: ['me'] }),
      ...times(2, { winners: ['me'], losers: ['heavy'] }),
      // 0-1 against 'blip' — a single loss.
      { winners: ['blip'], losers: ['me'] },
    ]);
    const stats = finalizeStats('L', 'me', acc);

    // heavy: (6+1)/(2+1)=2.33 ranks above blip: (1+1)/(0+1)=2.0, and records
    // stay raw.
    expect(stats.nemeses).toEqual([
      { playerId: 'heavy', won: 2, lost: 6 },
      { playerId: 'blip', won: 0, lost: 1 },
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
