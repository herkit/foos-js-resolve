import { PLAYER_CREATED } from '../event-types';
export default {
  Init: () => ({}),
  [PLAYER_CREATED]: (state, {timestamp}) => ({
    ...state,
    createdAt: timestamp
  })
};