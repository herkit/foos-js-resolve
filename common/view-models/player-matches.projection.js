import { PLAYER_CREATED, PLAYER_DELETED } from "../event-types";
export default {
  Init: () => {},
  [PLAYER_CREATED]: (state, { aggregateId }) => {
    let nextState = {...state}
    nextState[aggregateId] = []
    return (nextState)
  },
  [PLAYER_DELETED]: (state, { aggregateId }) => {
    let nextState = {...state}
    delete nextState[aggregateId]
    return (nextState)
  },
};