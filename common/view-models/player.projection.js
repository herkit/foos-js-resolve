import { PLAYER_CREATED } from "../event-types";
export default {
  Init: () => null,
  [PLAYER_CREATED]: (state, {aggregateId, payload: {name, email, avatar}}) => ({
    id: aggregateId,
    name,
    email,
    avatar,
    matches: []
  })
};