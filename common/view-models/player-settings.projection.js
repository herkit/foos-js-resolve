import { PLAYER_CREATED, PLAYER_DELETED, PLAYER_SET_DEFAULT_LEAGUE } from "../event-types";
export default {
  Init: () => ({ name: "Unknown Player", deleted: false, settings: {} }),
  [PLAYER_CREATED]: (state, { payload: { name } }) => (
    {
      ...state,
      name
    }
  ),
  [PLAYER_SET_DEFAULT_LEAGUE]: (state, { payload: { id, slug } }) => (
    {
      ...state,
      settings: {
        ...state.settings,
        defaultLeague: { id, slug }
      }
    }
  ),
  [PLAYER_DELETED]: (state, { aggregateId }) => (
    {
      ...state,
      name: 'Removed player',
      settings: {},
      deleted: true
    }
  )
};