import { PLAYER_WON_MATCH, PLAYER_LOST_MATCH } from '../event-types'

const ensurePlayer = async (store, seasonid, playerid) => {
  const current = await store.findOne('SeasonPlayers',
  { 
    seasonid,
    playerid
  })

  console.log(current)

  if (!current)
  {
    console.log("inserting player:", seasonid, playerid)
    await store.insert('SeasonPlayers', 
    { 
      seasonid, 
      playerid, 
      winCount: 0,
      winStreak: 0,
      played: 0,
      lossCount: 0,
      lossStreak: 0,
      played: 0
    })
    console.log('inserted')
  }
}

const readModel = {
  Init: async (store) => {
    await store.defineTable('SeasonPlayers', {
      indexes: {
        seasonid: 'string',
        playerid: 'string'
      },
      fields: ['seasonid', 'playerid', 'rank', 'played', 'winCount', 'winStreak', 'lossCount', 'lossStreak', 'recentgames']
    })
  },
  [PLAYER_WON_MATCH]: async (store, { aggregateId, payload: { season, rank }}) => {
    await ensurePlayer(store, season, aggregateId);
    console.log("updating player", aggregateId, "season:", season)
    await store.update(
      'SeasonPlayers',
      { 
        seasonid: season,
        playerid: aggregateId
      },
      {
        $set: { 
          rank, 
          lossStreak: 0 
        },
        $inc: { 
          winCount: 1, 
          winStreak: 1, 
          played: 1
        }
      }
    )
    console.log("updated")
  },
  [PLAYER_LOST_MATCH]: async (store, { aggregateId, payload: { season, rank }}) => {
    await ensurePlayer(store, season, aggregateId);
    console.log("updating player", aggregateId, "season:", season)
    await store.update(
      'SeasonPlayers',
      { 
        seasonid: season,
        playerid: aggregateId
      },
      {
        $set: { 
          rank, 
          winStreak: 0 
        },
        $inc: {
          lossCount: 1, 
          lossStreak: 1, 
          played: 1 
        }
      }
    )
    console.log("updated")
  }
}

export default readModel
