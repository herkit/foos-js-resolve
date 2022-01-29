import { SINGLEMATCH_PLAYED, DOUBLEMATCH_PLAYED, PLAYER_LOST_MATCH, PLAYER_WON_MATCH } from "../event-types"

const PLAYERRANK = "PlayerRank";

const singleMatchPlayed = async ({ store, sideEffects }, event) => {
  const winner = await store.findOne(PLAYERRANK, { playerid: event.payload.winner } )
  const loser = await store.findOne(PLAYERRANK, { playerid: event.payload.loser } )

  const winnerrank = winner ? winner.rank : 1500;
  const loserrank = loser ? loser.rank : 1500;

  let scoreChange = 10;
  if (winnerrank > loserrank) {
    scoreChange = 5;
    if (winnerrank >= loserrank + 100)
      scoreChange = 0;
  } else {
    if (winnerrank < loserrank - 100)
    {
      scoreChange = 20;
    } 
  }
    
  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.winner,
    type: "registerWin",
    payload: { matchid: event.aggregateId, matchtype: "single", score: scoreChange, coplayers: [], opponents: [event.payload.loser], rank: winnerrank + scoreChange }
  })

  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.loser,
    type: "registerLoss",
    payload: { matchid: event.aggregateId, matchtype: "single", score: scoreChange, coplayers: [], opponents: [event.payload.winner], rank: loserrank - scoreChange }
  })

  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.winner
    },
    {
      $set: { rank: winnerrank + scoreChange }
    },
    { upsert: true }
  )
  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.loser
    },
    {
      $set: { rank: loserrank - scoreChange }
    },
    { upsert: true }
  )
}

const doubleMatchPlayed = async ({ store, sideEffects }, event) => {
  const winner1 = await store.findOne(PLAYERRANK, { playerid: event.payload.winner1 } )
  const winner2 = await store.findOne(PLAYERRANK, { playerid: event.payload.winner2 } )
  const loser1 = await store.findOne(PLAYERRANK, { playerid: event.payload.loser1 } )
  const loser2 = await store.findOne(PLAYERRANK, { playerid: event.payload.loser2 } )

  const winner1rank = winner1 ? winner1.rank : 1500;
  const winner2rank = winner2 ? winner2.rank : 1500;

  const loser1rank = loser1 ? loser1.rank : 1500;
  const loser2rank = loser2 ? loser2.rank : 1500;

  const winnerTeamRank = winner1rank + winner2rank;
  const loserTeamRank = loser1rank + loser2rank;

  let scoreChange = 5;
  if (winnerTeamRank > loserTeamRank) {
    scoreChange = 3;
    if (winnerTeamRank > loserTeamRank + 100) scoreChange = 0;
  } else {
    if (winnerTeamRank < loserTeamRank - 100) scoreChange = 10;
  }

  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.winner1,
    type: "registerWin",
    payload: { 
      matchid: event.aggregateId, 
      matchtype: "double", 
      score: scoreChange, 
      coplayers: [event.payload.winner2], 
      opponents: [event.payload.loser1, event.payload.loser2],
      rank: winner1rank + scoreChange
    }
  })

  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.winner2,
    type: "registerWin",
    payload: { 
      matchid: event.aggregateId, 
      matchtype: "double", 
      score: scoreChange, 
      coplayers: [event.payload.winner1], 
      opponents: [event.payload.loser1, event.payload.loser2],
      rank: winner2rank + scoreChange
    }
  })

  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.loser1,
    type: "registerLoss",
    payload: { 
      matchid: event.aggregateId, 
      matchtype: "double", 
      score: - scoreChange, 
      coplayers: [event.payload.loser2], 
      opponents: [event.payload.winner1, event.payload.winner2],
      rank: loser1rank - scoreChange
    }
  })

  await sideEffects.executeCommand({
    aggregateName: "Player",
    aggregateId: event.payload.loser2,
    type: "registerLoss",
    payload: { 
      matchid: event.aggregateId, 
      matchtype: "double", 
      score: - scoreChange, 
      coplayers: [event.payload.loser1], 
      opponents: [event.payload.winner1, event.payload.winner2],
      rank: loser2rank - scoreChange
    }
  })

  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.winner1
    },
    {
      $set: { rank: winner1rank + scoreChange }
    },
    { upsert: true }
  )

  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.winner2
    },
    {
      $set: { rank: winner2rank + scoreChange }
    },
    { upsert: true }
  )

  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.loser1
    },
    {
      $set: { rank: loser1rank - scoreChange }
    },
    { upsert: true }
  )

  await store.update(PLAYERRANK, 
    {
      playerid: event.payload.loser2
    },
    {
      $set: { rank: loser2rank - scoreChange }
    },
    { upsert: true }
  )
}

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable(PLAYERRANK, {
        indexes: { playerid: 'string' },
        fields: ['rank'],
      })
    },
    [SINGLEMATCH_PLAYED]: singleMatchPlayed,
    [DOUBLEMATCH_PLAYED]: doubleMatchPlayed
  },
  sideEffects: {
    
  },
}