import { SEASON_STARTED, SINGLEMATCH_PLAYED } from '../event-types';
export default {
  Init: () => ({}),
  [SEASON_STARTED]: (state, { timestamp }) => ({
    ...state,
    startedAt: timestamp,
    matches: {},
    ranks: {}
  }),
  [SINGLEMATCH_PLAYED]: (state, {winnerPlayer, loserPlayer }) => {

    return ({
      ...state,
      lastMatch: timestamp
    })
  }
};