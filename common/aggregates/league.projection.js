import { LEAGUE_CREATED, SEASON_STARTED } from '../event-types';
export default {
  Init: () => ({ seasons:[], admins: []}),
  [LEAGUE_CREATED]: (state, {timestamp, payload: { rating, owner }}) => ({
    ...state,
    seasons: [],
    admins: [...state.admins, owner],
    rating,
    createdAt: timestamp
  }),
  [SEASON_STARTED]: (state, { payload: { seasonid } }) => ({
    ...state,
    currentSeason: seasonid,
    seasons: [...state.seasons, seasonid]
  })
};