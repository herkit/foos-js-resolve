import { PLAYER_CREATED, PLAYER_DELETED } from '../event-types'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Players', {
      indexes: {
        id: 'string',
      },
      fields: ['name', 'email', 'avatar', 'rank'],
    })
  },
  [PLAYER_CREATED]: async (
    store,
    { aggregateId, payload: { name, email, avatar, rank } }
  ) => {
    console.log(`update player {aggregateId}`)
    await store.update(
      'Players',
      { id: aggregateId },
      { $set: { name, email, avatar, rank } },
      { upsert: true }
    )
  },
  [PLAYER_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Players', { id: aggregateId })
  },
}
export default readModel
