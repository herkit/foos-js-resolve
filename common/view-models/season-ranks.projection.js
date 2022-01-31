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
  Init: () => ( {players: {} }),
  [SEASON_MATCH_REGISTERED]: (state, { payload: { winners, losers } }) => {
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

    const stateChanges = {
      ...state,
      players: {
        ...state.players,
        ...winnerranks.reduce((prev, current) => (
          {
            ...prev, 
            [current.id]: { 
              ...current,
              rank: current.rank + scorePerWinner, 
              played: (current.played ?? 0) + 1,
              winCount: (current.winCount ?? 0) + 1,
              winStreak: (current.winStreak ?? 0) + 1, 
              longestWinStreak: Math.max((current.winStreak ?? 0) + 1, (current.longestWinStreak ?? 0)),
              lossStreak: 0,
            }
          }), {}),
        ...loserranks.reduce((prev, current) => (
          {
            ...prev, 
            [current.id]: { 
              ...current,
              id: current.id, 
              rank: current.rank - scorePerLoser, 
              played: (current.played ?? 0) + 1,
              winStreak: 0, 
              lossCount: (current.lossCount ?? 0) + 1,
              lossStreak: (current.lossStreak ?? 0) + 1,
              longestLossStreak: Math.max((current.lossStreak ?? 0) + 1, (current.longestLossStreak ?? 0), 0),
            }
          }), {})
      }
    }

    console.log(stateChanges)

    return ({
      ...state,
      ...stateChanges
    })
  }
};