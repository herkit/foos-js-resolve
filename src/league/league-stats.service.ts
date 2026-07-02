import { Inject, Injectable } from '@nestjs/common';
import type { EventStore } from '@event-driven-io/emmett';
import { EVENT_STORE } from '../event-store/event-store.constants';
import type { SeasonEvent } from '../season/season.events';
import {
  evolveSeasonRanks,
  initialSeasonRanks,
} from '../season/season-ranks.view';
import { LeagueService } from './league.service';
import {
  accumulateMatch,
  finalizeStats,
  initialStatsAccumulator,
  withSeasonFinalRank,
  type PlayerLeagueStats,
  type StatsAccumulator,
} from './league-stats';

const seasonStreamId = (seasonId: string): string => `season-${seasonId}`;

/**
 * On-demand read facade for a player's league-wide career stats.
 *
 * Mirrors `SeasonService.getRanks`: rather than a persisted projection, it
 * folds each of the league's season streams at query time. The season's final
 * rank comes from reusing `evolveSeasonRanks` verbatim; totals and partner /
 * nemesis tallies are folded from the raw `SEASON_MATCH_REGISTERED` events in
 * the same single pass over each stream.
 */
@Injectable()
export class LeagueStatsService {
  constructor(
    @Inject(EVENT_STORE) private readonly store: EventStore,
    private readonly leagues: LeagueService,
  ) {}

  async getPlayerStats(
    leagueId: string,
    playerId: string,
  ): Promise<PlayerLeagueStats> {
    const { seasons } = await this.leagues.getState(leagueId);

    let acc: StatsAccumulator = initialStatsAccumulator();

    for (const seasonId of seasons) {
      const { events } = await this.store.readStream<SeasonEvent>(
        seasonStreamId(seasonId),
      );
      if (!events?.length) continue;

      const ranks = events.reduce(evolveSeasonRanks, initialSeasonRanks());
      acc = withSeasonFinalRank(
        acc,
        ranks.ranks.find((r) => r.id === playerId)?.rank,
      );

      for (const event of events) {
        if (event.type === 'SEASON_MATCH_REGISTERED') {
          acc = accumulateMatch(acc, playerId, event.data);
        }
      }
    }

    return finalizeStats(leagueId, playerId, acc);
  }
}
