import { LEAGUE_CREATED, PLAYER_CREATED, PLAYER_DELETED, PLAYER_LOST_MATCH, PLAYER_WON_MATCH, SEASON_STARTED } from '../event-types'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Leagues', {
      indexes: {
        id: 'string'
      },
      fields: ['name']
    })
  },
  [LEAGUE_CREATED]: async (store, { aggregateId, payload: { name } }) => 
  {
    await store.update(
      'Leagues',
      { id: aggregateId },
      { $set: { name } },
      { upsert: true }
    )
  }/*,
  [SEASON_STARTED]: async (store, { aggregateId, timestamp, payload: { seasonid }}) => {
    const seasons = await store.findOne('Leagues', { id: aggregateId })?.seasons ?? [];
    await store.update(
      'Leagues',
      { id: aggregateId },
      { $set: 
        { 
          seasons: [...seasons, { id: seasonid, startedAt: timestamp, players: [] }], 
          currentSeason: seasonid 
        }
      }      
    )
  }*/
}
export default readModel
