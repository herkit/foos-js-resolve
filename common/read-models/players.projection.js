import { PLAYER_CREATED, PLAYER_DELETED, PLAYER_LOST_MATCH, PLAYER_WON_MATCH } from '../event-types'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Players', {
      indexes: {
        email: 'string',
        id: 'string'
      },
      fields: ['name', 'email', 'password', 'avatar', 'currentRank', 'isSuperuser'],
    })
  },
  [PLAYER_CREATED]: async (store, { aggregateId, payload: { name, email, avatar, password } }) => 
  {
    // the first registered user is always a superuser
    console.log("check if a user exists")
    
    const userExist = await store.find('Players', {}, { id: 1 }, { name: 1 })
    const isSuperuser = (Array.isArray(userExist) && userExist.length == 0)

    await store.update(
      'Players',
      { id: aggregateId },
      { $set: { name, email, avatar, password, isSuperuser } },
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
