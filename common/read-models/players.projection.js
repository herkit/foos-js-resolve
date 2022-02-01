import { PLAYER_CREATED, PLAYER_DELETED, PLAYER_LOST_MATCH, PLAYER_WON_MATCH } from '../event-types'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Players', {
      indexes: {
        id: 'string'
      },
      fields: ['name', 'email', 'password', 'avatar', 'currentRank'],
    })
  },
  [PLAYER_CREATED]: async (store, { aggregateId, payload: { name, email, avatar, password } }) => 
  {
    await store.update(
      'Players',
      { id: aggregateId },
      { $set: { name, email, avatar, password } },
      { upsert: true }
    )
  },
  [PLAYER_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Players', { id: aggregateId })
  },
  [PLAYER_LOST_MATCH]: async (store, { aggregateId, payload: { rank } }) => {
    await store.update('Players', { id: aggregateId }, { $set: { currentRank: rank }})
  },
  [PLAYER_WON_MATCH]: async (store, { aggregateId, payload: { rank } }) => {
    await store.update('Players', { id: aggregateId }, { $set: { currentRank: rank }})
  }
}
export default readModel
