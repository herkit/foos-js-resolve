import { DOUBLEMATCH_PLAYED, SINGLEMATCH_PLAYED } from '../event-types';
export default {
  Init: () => ({}),
  [DOUBLEMATCH_PLAYED]: (state, {timestamp}) => ({
    ...state,
    playedAt: timestamp
  }),
  [SINGLEMATCH_PLAYED]: (state, {timestamp}) => ({
    ...state,
    playedAt: timestamp
  })
};