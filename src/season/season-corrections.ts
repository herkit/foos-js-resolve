import type { SeasonEvent } from './season.events';

/**
 * Resolve a raw Season event stream into its *effective* ordered event list by
 * applying corrections and voids to the matches they reference:
 *
 *  - a `SEASON_MATCH_CORRECTED` replaces the referenced match's winners/losers
 *    in place, keeping the match at its original position and timestamp
 *    (last correction wins if a match is corrected more than once);
 *  - a `SEASON_MATCH_VOIDED` drops the referenced match entirely (void wins
 *    over any correction for the same match);
 *  - the correction/void events themselves are stripped from the output.
 *
 * Every consumer that folds `SEASON_MATCH_REGISTERED` (season ranks, league
 * career stats) pipes its events through this first and needs no further
 * correction awareness. Because ratings are path-dependent — each match's score
 * change depends on the ranks at that point in the fold — correcting in place
 * and re-folding recomputes all downstream ratings automatically.
 */
export const applyCorrections = (events: SeasonEvent[]): SeasonEvent[] => {
  const voided = new Set<string>();
  const corrections = new Map<string, { winners: string[]; losers: string[] }>();

  for (const event of events) {
    if (event.type === 'SEASON_MATCH_VOIDED') {
      voided.add(event.data.matchid);
    } else if (event.type === 'SEASON_MATCH_CORRECTED') {
      // Last correction wins.
      corrections.set(event.data.matchid, {
        winners: event.data.winners,
        losers: event.data.losers,
      });
    }
  }

  const effective: SeasonEvent[] = [];
  for (const event of events) {
    if (
      event.type === 'SEASON_MATCH_CORRECTED' ||
      event.type === 'SEASON_MATCH_VOIDED'
    ) {
      continue;
    }

    if (event.type === 'SEASON_MATCH_REGISTERED') {
      if (voided.has(event.data.matchid)) continue;
      const correction = corrections.get(event.data.matchid);
      if (correction) {
        effective.push({
          ...event,
          data: { ...event.data, ...correction },
        });
        continue;
      }
    }

    effective.push(event);
  }

  return effective;
};
