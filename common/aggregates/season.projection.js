import { SEASON_MATCH_REGISTERED, SEASON_STARTED } from '../event-types';
export default {
  Init: () => ({matches: []}),
  [SEASON_STARTED]: (state, { timestamp, payload: { leagueid } }) => ({
    ...state,
    leagueid: leagueid,
    createdAt: timestamp,
  }),
  [SEASON_MATCH_REGISTERED]: (state, { payload: { matchid }}) => ({
    ...state,
    matches: [...state.matches, matchid]
  })
};