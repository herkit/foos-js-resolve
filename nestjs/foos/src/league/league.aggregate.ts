import { IllegalStateError } from '@event-driven-io/emmett';
import type { Actor } from '../common/actor';
import type {
  LeagueCreated,
  LeagueEvent,
  SeasonStarted,
} from './league.events';

/**
 * League aggregate — ported from `common/aggregates/league.{projection,commands}.js`.
 */
export interface LeagueState {
  seasons: string[];
  admins: string[];
  rating?: string;
  createdAt?: number;
  currentSeason?: string;
}

export const initialLeagueState = (): LeagueState => ({
  seasons: [],
  admins: [],
});

export const evolveLeague = (
  state: LeagueState,
  event: LeagueEvent,
): LeagueState => {
  switch (event.type) {
    case 'LEAGUE_CREATED':
      return {
        ...state,
        seasons: [],
        admins: [...state.admins, event.data.owner],
        rating: event.data.rating,
        createdAt: state.createdAt ?? 1,
      };
    case 'SEASON_STARTED':
      return {
        ...state,
        currentSeason: event.data.seasonid,
        seasons: [...state.seasons, event.data.seasonid],
      };
    default:
      return state;
  }
};

export const decideCreateLeague = (
  state: LeagueState,
  input: { name: string; rating?: string },
  actor: Actor,
): LeagueCreated => {
  if (!actor.id) throw new IllegalStateError('The "id" field is required');
  if (state.createdAt) throw new IllegalStateError('The league already exists');
  if (!input.name) throw new IllegalStateError('name is required');
  return {
    type: 'LEAGUE_CREATED',
    data: { name: input.name, rating: input.rating ?? 'elo', owner: actor.id },
  };
};

export const decideStartSeason = (
  state: LeagueState,
  leagueId: string,
  input: { seasonid: string },
): SeasonStarted => {
  if (state.currentSeason === input.seasonid)
    throw new IllegalStateError('Season is currently in progress');
  if (state.seasons.includes(input.seasonid))
    throw new IllegalStateError('Season has been started before');
  return {
    type: 'SEASON_STARTED',
    data: { seasonid: input.seasonid, leagueid: leagueId },
  };
};
