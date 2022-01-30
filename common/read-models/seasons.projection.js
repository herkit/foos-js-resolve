import { SEASON_STARTED } from '../event-types'

const readModel = {
  Init: async (store) => {
    await store.defineTable('Seasons', {
      indexes: {
        id: 'string',
        leagueid: 'string'
      },
      fields: ['started', 'ranks', 'recentgames']
    })
  },
  [SEASON_STARTED]: async (store, { aggregateId, timestamp, payload: { seasonid }}) => {
    await store.insert(
      'Seasons',
      { 
        id: seasonid,
        leagueid: aggregateId,
        started: timestamp
      }      
    )
  }
}

export default readModel
