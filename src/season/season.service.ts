import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type EventStore } from '@event-driven-io/emmett';
import { Subject } from 'rxjs';
import { EVENT_STORE } from '../event-store/event-store.constants';
import { LeagueService } from '../league/league.service';
import {
  decideCreateSeason,
  decideRegisterMatch,
  evolveSeason,
  initialSeasonState,
} from './season.aggregate';
import {
  evolveSeasonRanks,
  initialSeasonRanks,
  type SeasonRanksState,
} from './season-ranks.view';

const streamId = (seasonId: string): string => `season-${seasonId}`;

export interface RanksUpdate {
  seasonId: string;
  ranks: SeasonRanksState;
}

/**
 * Season write + read facade.
 *
 * - Commands go through Emmett's `CommandHandler` (load stream -> evolve ->
 *   decide -> append), replacing reSolve's `executeCommand`.
 * - Reads fold the stream into the `SeasonRanks` view-model, replacing
 *   reSolve's `executeQuery` / reactive view-model.
 * - `updates$` fans out live view-model changes to the WebSocket gateway.
 */
@Injectable()
export class SeasonService {
  private readonly handle = CommandHandler({
    evolve: evolveSeason,
    initialState: initialSeasonState,
  });

  private readonly updates$ = new Subject<RanksUpdate>();
  readonly updates = this.updates$.asObservable();

  constructor(
    @Inject(EVENT_STORE) private readonly store: EventStore,
    private readonly leagues: LeagueService,
  ) {}

  /**
   * Create a season, inheriting its rating method from the parent league.
   *
   * A caller may still pin a rating explicitly (the LeagueCreation saga passes
   * the one carried on `LEAGUE_CREATED`); when it doesn't, we resolve it from
   * the league's current state so a new season always uses the league's rating
   * method rather than silently defaulting.
   */
  async createSeason(
    seasonId: string,
    input: { leagueid: string; rating?: string },
  ): Promise<SeasonRanksState> {
    const rating =
      input.rating ?? (await this.leagues.getState(input.leagueid)).rating;
    await this.handle(this.store, streamId(seasonId), (state) =>
      decideCreateSeason(state, { leagueid: input.leagueid, rating }),
    );
    return this.getRanks(seasonId);
  }

  async registerMatch(
    seasonId: string,
    input: { matchid: string; winners: string[]; losers: string[] },
  ): Promise<SeasonRanksState> {
    const command = { ...input, timestamp: Date.now() };
    await this.handle(this.store, streamId(seasonId), (state) =>
      decideRegisterMatch(state, command),
    );
    const ranks = await this.getRanks(seasonId);
    this.updates$.next({ seasonId, ranks });
    return ranks;
  }

  async getRanks(seasonId: string): Promise<SeasonRanksState> {
    const { state } = await this.store.aggregateStream(streamId(seasonId), {
      evolve: evolveSeasonRanks,
      initialState: initialSeasonRanks,
    });
    return state ?? initialSeasonRanks();
  }
}
