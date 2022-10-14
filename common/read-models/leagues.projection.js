import { LEAGUE_CREATED } from '../event-types'
import slugify from 'slugify'

const slugExists = async (store, slug) => {
  const league = await store.findOne('Leagues', { slug });
  if (league)
    return true
  return false
}

const readModel = {
  Init: async (store) => {
    await store.defineTable('Leagues', {
      indexes: {
        id: 'string'
      },
      fields: ['name', 'slug', 'owner', 'admins', 'rating']
    })
  },
  [LEAGUE_CREATED]: async (store, { aggregateId, payload: { name, owner, rating } }) => 
  {
    const slugBase = slugify(name).toLowerCase()
    var slug = slugBase

    var exists = await slugExists(store, slug)
   
    var postfix = 0
    while (exists) {
      postfix = (postfix ?? 0) + 1
      slug = slugBase + "-" + postfix
      exists = await slugExists(store, slug)
    }

    await store.update(
      'Leagues',
      { id: aggregateId },
      { $set: { name, slug, owner, admins: [owner], rating } },
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
