import { PLAYER_CREATED, PLAYER_DELETED } from "../event-types";
export default {
  Init: () => {},
  [PLAYER_CREATED]: (state, { aggregateId, payload: { name } }) => (
    name
  ),
  [PLAYER_DELETED]: (state, { aggregateId }) => (
    'Removed player'
  )
};