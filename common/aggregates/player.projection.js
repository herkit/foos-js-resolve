import { matches } from 'lodash';
import { PLAYER_CREATED, PLAYER_LOST_MATCH, PLAYER_WON_MATCH } from '../event-types';
export default {
  Init: () => ({}),
  [PLAYER_CREATED]: (state, {timestamp}) => ({
    ...state,
    rank: 1500,
    winStreak: 0,
    lossStreak: 0,
    matches: [],
    createdAt: timestamp
  }),
  [PLAYER_LOST_MATCH]: (state, { payload: { matchid, score } }) => ({
    ...state,
    rank: state.rank-score,
    winStreak: 0,
    lossStreak: state.lossStreak++,
    matches: [...state.matches, matchid]
  }),
  [PLAYER_WON_MATCH]: (state, { payload: { matchid, score } }) => ({
    ...state,
    rank: state.rank-score,
    winStreak: state.winStreak++,
    lossStreak: 0,
    matches: [...state.matches, matchid]
  })
};