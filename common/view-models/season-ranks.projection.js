import { SEASON_MATCH_REGISTERED } from "../event-types";

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

export default {
  Init: () => ( {players: {}, rankhistory: {} }),
  [SEASON_MATCH_REGISTERED]: (state, { timestamp, payload: { winners, losers } }) => {
    const winnerranks = winners.map(player => state.players[player] ?? { id: player, ...defaultRank });
    const loserranks = losers.map(player => state.players[player] ?? { id: player, ...defaultRank });
    
    const totalwinner = winnerranks.reduce((prev, current) => (prev + current.rank), 0);
    const totalloser = loserranks.reduce((prev, current) => (prev + current.rank), 0);

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

    const scorePerWinner = scoreChange / winners.length;
    const scorePerLoser = scoreChange / losers.length;

    const newRanks = [
      ...winnerranks.map((p) => ({
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
      }))
    ]

    const stateChanges = {
      ...state,
      players: {
        ...state.players,
        ...newRanks.reduce((playersState, { id, rank, played, winCount, winStreak, longestWinStreak, lossCount, lossStreak, longestLossStreak}) => (
          {
            ...playersState,
            [id]: { 
              id,
              rank, 
              played,
              winCount,
              winStreak, 
              longestWinStreak,
              lossCount,
              lossStreak,
              longestLossStreak
            }
          }), {})
      },
      rankhistory: {
        ...state.rankhistory,
        ...newRanks.reduce((playersState, { id, rank }) => ({
          ...playersState,
          [id]: [
            ...state.rankhistory[id] ?? [],
            { timestamp, rank }
          ]
        }), {})
      }
    }

    return ({
      ...state,
      ...stateChanges
    })
  }
};