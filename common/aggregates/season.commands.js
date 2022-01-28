import { DOUBLEMATCH_PLAYED, SEASON_STARTED, SINGLEMATCH_PLAYED } from "../event-types";
export default {
    startSeason: (state) => {
      if (state.createdAt) throw new Error("The player already exists")
      if (!name) throw new Error("name is required")
      if (!email) throw new Error("email is required")
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        throw new Error("email is invalid");
      return {
        type: SEASON_STARTED
      }
    },
    registerDoubleMatch: (state, { winnerPlayer1, winnerPlayer2, loserPlayer1, loserPlayer2 }) =>
    {
      if (!state.startedAt) {
        throw new Error('Season has not been started')
      }
  
      return {
        type: DOUBLEMATCH_PLAYED,
        payload: {
          winnerPlayer1,
          winnerPlayer2,
          loserPlayer1,
          loserPlayer2
        }
      }
    },
    registerSingleMatch: (state, { winnerPlayer, loserPlayer }) => {
      if (!state.startedAt) {
        throw new Error('Season has not been started')
      }

      return {
        type: SINGLEMATCH_PLAYED,
        payload: {
          winnerPlayer,
          loserPlayer
        }
      }
    }
  }