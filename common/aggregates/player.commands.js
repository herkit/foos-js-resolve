import { PLAYER_CREATED, PLAYER_DELETED, PLAYER_WON_MATCH, PLAYER_LOST_MATCH } from "../event-types";
export default {
    createPlayer: (state, {payload: {name, email, avatar}}) => {
      console.log("Create player")
      if (state.createdAt) throw new Error("The player already exists")
      if (!name) throw new Error("name is required")
      if (!email) throw new Error("email is required")
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        throw new Error("email is invalid");
      return {
        type: PLAYER_CREATED,
        payload: {name, email, avatar}
      }
    },
    deletePlayer: (state) =>
    {
      if (!state.createdAt)
        throw new Error('Player does not exist')
  
      return {
        type: PLAYER_DELETED
      }
    },
    registerWin: (state, {payload: { matchid, matchtype, score, coplayers, opponents, rank }}) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_WON_MATCH,
        payload: { matchid, matchtype, score, coplayers, opponents, rank }
      }
    },
    registerLoss: (state, {payload: { matchid, matchtype, score, coplayers, opponents, rank }}) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_LOST_MATCH,
        payload: { matchid, matchtype, score, coplayers, opponents, rank }
      }
    }
  }