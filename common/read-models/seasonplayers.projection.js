import { PLAYER_WON_MATCH, PLAYER_LOST_MATCH } from '../event-types'

const readModel = {
  Init: async (store) => {
    await store.defineTable('SeasonPlayers', {
      indexes: {
      },
      fields: ['seasonid', 'playerid', 'rank', 'played', 'wonCount', 'winStreak', 'lostCount', 'lossStreak', 'recentgames']
    })
  },
  [PLAYER_WON_MATCH]: async (store, { aggregateId, payload: { season, rank }}) => {
    await store.update(
      'SeasonPlayers',
      { 
        seasonid: season,
        playerid: aggregateId
      },
      {
        $set: { rank, lossStreak: 0 },
        $inc: { wonCount: 1, winStreak: 1, played: 1 },
      },
      {
        upsert: true
      }
    )
  },
  [PLAYER_LOST_MATCH]: async (store, { aggregateId, payload: { season, rank }}) => {
    await store.update(
      'SeasonPlayers',
      { 
        seasonid: season,
        playerid: aggregateId
      },
      {
        $set: { rank, winStreak: 0 },
        $inc: { lossCount: 1, lossStreak: 1, played: 1 },
      },
      {
        upsert: true
      }
    )
  }
}

export default readModel
