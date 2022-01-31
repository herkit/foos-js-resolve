import { LEAGUE_CREATED, SEASON_STARTED } from '../event-types';
export default {
  Init: () => ({}),
  [LEAGUE_CREATED]: (state, {timestamp, payload: { name }}) => ({
    ...state,
    name,
    seasons: [],
    createdAt: timestamp
  }),
  [SEASON_STARTED]: (state, { payload: { seasonid } }) => ({
    ...state,
    currentSeason: seasonid,
    seasons: [...state.seasons, seasonid]
  })
};