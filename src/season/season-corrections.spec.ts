import { applyCorrections } from './season-corrections';
import {
  evolveSeasonRanks,
  initialSeasonRanks,
  type SeasonRanksState,
} from './season-ranks.view';
import type { SeasonEvent } from './season.events';

const fold = (events: SeasonEvent[]): SeasonRanksState =>
  applyCorrections(events).reduce(evolveSeasonRanks, initialSeasonRanks());

const rankOf = (state: SeasonRanksState, id: string): number =>
  state.ranks.find((p) => p.id === id)?.rank ?? 0;

const created = (): SeasonEvent => ({
  type: 'SEASON_CREATED',
  data: { leagueid: 'L', rating: 'elo' },
});

const match = (
  matchid: string,
  winners: string[],
  losers: string[],
  timestamp = 1,
): SeasonEvent => ({
  type: 'SEASON_MATCH_REGISTERED',
  data: { matchid, winners, losers, timestamp },
});

const corrected = (
  matchid: string,
  winners: string[],
  losers: string[],
): SeasonEvent => ({
  type: 'SEASON_MATCH_CORRECTED',
  data: {
    matchid,
    winners,
    losers,
    correctedBy: 'admin',
    reason: 'typo',
    timestamp: 99,
  },
});

const voided = (matchid: string): SeasonEvent => ({
  type: 'SEASON_MATCH_VOIDED',
  data: { matchid, voidedBy: 'admin', reason: 'never happened', timestamp: 99 },
});

const registeredMatches = (events: SeasonEvent[]) =>
  events.filter((e) => e.type === 'SEASON_MATCH_REGISTERED');

describe('applyCorrections', () => {
  it('passes an uncorrected stream through unchanged', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b']),
      match('m2', ['b'], ['a']),
    ];
    expect(applyCorrections(events)).toEqual(events);
  });

  it('strips correction/void events from the output', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b']),
      corrected('m1', ['b'], ['a']),
      voided('m1'),
    ];
    const out = applyCorrections(events);
    expect(out.some((e) => e.type === 'SEASON_MATCH_CORRECTED')).toBe(false);
    expect(out.some((e) => e.type === 'SEASON_MATCH_VOIDED')).toBe(false);
  });

  it('replaces a corrected match in place, preserving position and timestamp', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b'], 100),
      match('m2', ['c'], ['d'], 200),
      corrected('m1', ['b'], ['a']),
    ];
    const out = registeredMatches(applyCorrections(events));
    expect(out).toHaveLength(2);
    // corrected match stays first (original position) and keeps its timestamp
    expect(
      out[0].type === 'SEASON_MATCH_REGISTERED' && out[0].data,
    ).toMatchObject({
      matchid: 'm1',
      winners: ['b'],
      losers: ['a'],
      timestamp: 100,
    });
    expect(
      out[1].type === 'SEASON_MATCH_REGISTERED' && out[1].data.matchid,
    ).toBe('m2');
  });

  it('drops a voided match entirely', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b']),
      match('m2', ['c'], ['d']),
      voided('m1'),
    ];
    const out = registeredMatches(applyCorrections(events));
    expect(out).toHaveLength(1);
    expect(
      out[0].type === 'SEASON_MATCH_REGISTERED' && out[0].data.matchid,
    ).toBe('m2');
  });

  it('applies the last correction when a match is corrected more than once', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b']),
      corrected('m1', ['b'], ['a']),
      corrected('m1', ['a'], ['b']),
    ];
    const out = registeredMatches(applyCorrections(events));
    expect(
      out[0].type === 'SEASON_MATCH_REGISTERED' && out[0].data.winners,
    ).toEqual(['a']);
  });

  it('lets a void win over a correction for the same match', () => {
    const events = [
      created(),
      match('m1', ['a'], ['b']),
      corrected('m1', ['b'], ['a']),
      voided('m1'),
    ];
    expect(registeredMatches(applyCorrections(events))).toHaveLength(0);
  });
});

describe('applyCorrections + evolveSeasonRanks (path-dependence)', () => {
  // Correcting an early match must recompute every downstream rating, not just
  // patch the two players in that match. The witness: a stream where m1 was
  // wrongly recorded then corrected must fold to the SAME ranks as a stream
  // where m1 was recorded correctly from the start.
  it('recomputes downstream ratings as if the match had been correct all along', () => {
    const created = (): SeasonEvent => ({
      type: 'SEASON_CREATED',
      data: { leagueid: 'L', rating: 'elo' },
    });
    const m = (id: string, w: string[], l: string[]): SeasonEvent => ({
      type: 'SEASON_MATCH_REGISTERED',
      data: { matchid: id, winners: w, losers: l, timestamp: 1 },
    });

    // m1 recorded backwards (b beat a), then corrected to (a beat b).
    const wrongThenCorrected = fold([
      created(),
      m('m1', ['b'], ['a']),
      m('m2', ['a'], ['c']),
      {
        type: 'SEASON_MATCH_CORRECTED',
        data: {
          matchid: 'm1',
          winners: ['a'],
          losers: ['b'],
          correctedBy: 'admin',
          reason: 'recorded backwards',
          timestamp: 99,
        },
      },
    ]);

    // The ground truth: m1 correct from the start.
    const correctFromStart = fold([
      created(),
      m('m1', ['a'], ['b']),
      m('m2', ['a'], ['c']),
    ]);

    expect(rankOf(wrongThenCorrected, 'a')).toBeCloseTo(
      rankOf(correctFromStart, 'a'),
    );
    expect(rankOf(wrongThenCorrected, 'b')).toBeCloseTo(
      rankOf(correctFromStart, 'b'),
    );
    expect(rankOf(wrongThenCorrected, 'c')).toBeCloseTo(
      rankOf(correctFromStart, 'c'),
    );
  });

  it('voiding a match folds identically to a stream that never had it', () => {
    const created = (): SeasonEvent => ({
      type: 'SEASON_CREATED',
      data: { leagueid: 'L', rating: 'elo' },
    });
    const m = (id: string, w: string[], l: string[]): SeasonEvent => ({
      type: 'SEASON_MATCH_REGISTERED',
      data: { matchid: id, winners: w, losers: l, timestamp: 1 },
    });

    const withVoid = fold([
      created(),
      m('m1', ['a'], ['b']),
      m('m2', ['a'], ['c']),
      {
        type: 'SEASON_MATCH_VOIDED',
        data: {
          matchid: 'm1',
          voidedBy: 'admin',
          reason: 'never happened',
          timestamp: 99,
        },
      },
    ]);

    const neverHappened = fold([created(), m('m2', ['a'], ['c'])]);

    expect(rankOf(withVoid, 'a')).toBeCloseTo(rankOf(neverHappened, 'a'));
    expect(rankOf(withVoid, 'c')).toBeCloseTo(rankOf(neverHappened, 'c'));
    expect(withVoid.matchcount).toBe(1);
  });
});
