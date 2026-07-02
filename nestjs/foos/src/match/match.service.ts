import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type EventStore } from '@event-driven-io/emmett';
import { EVENT_STORE } from '../event-store/event-store.constants';
import {
  decideRegisterDoubleMatch,
  decideRegisterSingleMatch,
  evolveMatch,
  initialMatchState,
} from './match.aggregate';

const streamId = (matchId: string): string => `match-${matchId}`;

@Injectable()
export class MatchService {
  private readonly handle = CommandHandler({
    evolve: evolveMatch,
    initialState: initialMatchState,
  });

  constructor(@Inject(EVENT_STORE) private readonly store: EventStore) {}

  registerSingleMatch(
    matchId: string,
    input: { winner: string; loser: string; season: string },
  ) {
    return this.handle(this.store, streamId(matchId), (state) =>
      decideRegisterSingleMatch(state, input),
    );
  }

  registerDoubleMatch(
    matchId: string,
    input: {
      winner1: string;
      winner2: string;
      loser1: string;
      loser2: string;
      season: string;
    },
  ) {
    return this.handle(this.store, streamId(matchId), (state) =>
      decideRegisterDoubleMatch(state, input),
    );
  }
}
