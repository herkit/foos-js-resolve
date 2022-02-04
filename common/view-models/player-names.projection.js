import { PLAYER_CREATED, PLAYER_DELETED } from "../event-types";
export default {
  Init: () => ({ name: "Unknown Player", deleted: false }),
  [PLAYER_CREATED]: (state, { aggregateId, payload: { name } }) => (
    {
      ...state,
      name
    }
  ),
  [PLAYER_DELETED]: (state, { aggregateId }) => (
    {
      ...state,
      name: 'Removed player',
      deleted: true
    }
  )
};