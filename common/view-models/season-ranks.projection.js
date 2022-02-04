import { SEASON_CREATED, SEASON_MATCH_REGISTERED } from "../event-types";
import _ from "lodash"
import EloRating, { calculate } from "elo-rating"

const defaultRank = { 
  rank: 1500, 
  winCount: 0, 
  winStreak: 0, 
  longestWinStreak: 0, 
  lossCount: 0, 
  lossStreak: 0, 
  longestLossStreak: 0, 
  played: 0 
}

var upsert = function (arr, key, newval) {
  var match = _.find(arr, key);
  if(match){
      var index = _.indexOf(arr, match);
      arr.splice(index, 1, newval);
  } else {
      arr.push(newval);
  }
};

const calculateElo = ({ avgwinner, avgloser }) => {
  let eloRatings = EloRating.calculate(avgwinner, avgloser);
  console.log("eloRatings:", eloRatings)
  return eloRatings.playerRating - avgwinner;
}

const calculateBasic = ({ totalwinner, totalloser }) => {
  let scoreChange = 10;
  if (totalwinner > totalloser) {
    scoreChange = 5;
    if (totalwinner >= totalloser + 100)
      scoreChange = 0;
  } else {
    if (totalwinner < totalloser - 100)
    {
      scoreChange = 20;
    } 
  }
  return scoreChange
}


export default {
  Init: () => ( { ranks: [], rankhistory: {}, rating: "basic" }),
  [SEASON_CREATED]: (state, { payload: { rating } }) => ({
    ...state,
    rating: rating ?? state.rating
  }),
  [SEASON_MATCH_REGISTERED]: (state, { timestamp, payload: { winners, losers } }) => {
    const ranks = [...state.ranks]

    const winnerranks = winners.map(player => ranks.find(({id}) => id == player) ?? { id: player, ...defaultRank });
    const loserranks = losers.map(player => ranks.find(({id}) => id == player) ?? { id: player, ...defaultRank });

    const totalwinner = winnerranks.reduce((prev, current) => (prev + current.rank), 0);
    const totalloser = loserranks.reduce((prev, current) => (prev + current.rank), 0);

    console.log(totalwinner, winnerranks.length, totalloser)

    const avgwinner = totalwinner / winnerranks.length;
    const avgloser = totalloser / loserranks.length;

    const playerdata = {
      totalloser,
      totalwinner,
      avgwinner,
      avgloser
    }

    let scoreChange = 0
    console.log(state.rating)
    switch(state.rating ?? "basic") {
      case "elo": 
        scoreChange = calculateElo(playerdata)
        break
      default:
        scoreChange = calculateBasic(playerdata)
    }
    console.log("change", scoreChange)

    const scorePerWinner = scoreChange / winners.length;
    const scorePerLoser = scoreChange / losers.length;

    const rankUpdates = [...winnerranks.map((p) => ({
      ...p, 
      rank: p.rank + scorePerWinner, 
      played: p.played + 1,
      winCount: p.winCount + 1,
      winStreak: p.winStreak + 1,
      longestWinStreak: Math.max(p.winStreak + 1, p.winStreak),
      lossStreak: 0
    })),
    ...loserranks.map((p) => ({
      ...p,
      rank: p.rank - scorePerLoser, 
      played: p.played + 1,
      winStreak: 0, 
      lossCount: p.lossCount + 1,
      lossStreak: p.lossStreak + 1,
      longestLossStreak: Math.max(p.lossStreak + 1, p.longestLossStreak, 0),
    }))]
   
    rankUpdates.forEach(p => upsert(ranks, { id: p.id }, p) )

    const lls = ranks.sort((a, b) => b.longestLossStreak - a.longestLossStreak)[0];
    const lws = ranks.sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];

    const stateChanges = {
      ...state,
      ranks: ranks.sort((a, b) => b.rank - a.rank),
      rankhistory: {
        ...state.rankhistory,
        ...ranks.reduce((playersState, { id, rank }) => ({
          ...playersState,
          [id]: [
            ...state.rankhistory[id] ?? [],
            { timestamp, rank }
          ]
        }), {})
      },
      records: {
        winStreak: { title: "Longest Win Streak", id: lws.id, record: lws.longestWinStreak },
        lossStreak: { title: "Longest Loss Streak", id: lls.id, record: lls.longestLossStreak },
      }
    }

    return ({
      ...state,
      ...stateChanges
    })
  }
};