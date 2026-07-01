import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type EventStore } from '@event-driven-io/emmett';
import { EVENT_STORE } from '../event-store/event-store.constants';
import type { Actor } from '../common/actor';
import {
  decideCreateLeague,
  decideStartSeason,
  evolveLeague,
  initialLeagueState,
} from './league.aggregate';

const streamId = (leagueId: string): string => `league-${leagueId}`;

@Injectable()
export class LeagueService {
  private readonly handle = CommandHandler({
    evolve: evolveLeague,
    initialState: initialLeagueState,
  });

  constructor(@Inject(EVENT_STORE) private readonly store: EventStore) {}

  createLeague(leagueId: string, input: { name: string; rating?: string }, actor: Actor) {
    return this.handle(this.store, streamId(leagueId), (state) =>
      decideCreateLeague(state, input, actor),
    );
  }

  startSeason(leagueId: string, input: { seasonid: string }) {
    return this.handle(this.store, streamId(leagueId), (state) =>
      decideStartSeason(state, leagueId, input),
    );
  }
}
