import { DOUBLEMATCH_PLAYED, PLAYER_CREATED, PLAYER_DELETED, SINGLEMATCH_PLAYED } from "../event-types";
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
  [SINGLEMATCH_PLAYED]: (state, { aggregateId, payload: { winner, loser }}) => (
    {
      ...state,
      [winner]: [...state[winner], aggregateId],
      [loser]: [...state[loser], aggregateId]
    }
  ),
  [DOUBLEMATCH_PLAYED]: (state, { aggregateId, payload: { winner1, winner2, loser1, loser2 }}) => (
    {
      ...state,
      [winner1]: [...state[winner1], aggregateId],
      [winner2]: [...state[winner2], aggregateId],
      [loser1]: [...state[loser1], aggregateId],
      [loser2]: [...state[loser2], aggregateId]
    }
  ),
};