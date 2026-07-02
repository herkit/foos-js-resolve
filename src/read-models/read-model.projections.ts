import { playersProjection } from './players.projection';
import { leaguesProjection } from './leagues.projection';
import { playerMatchesProjection } from './player-matches.projection';

/**
 * All read-model / view-model projections, registered inline with the event
 * store so they update in the same transaction as the append.
 */
export const readModelProjections = [
  playersProjection,
  leaguesProjection,
  playerMatchesProjection,
];
