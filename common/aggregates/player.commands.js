import hashPassword from "../../auth/passwordhash";
import { PLAYER_CREATED, PLAYER_DELETED, PLAYER_WON_MATCH, PLAYER_LOST_MATCH } from "../event-types";
export default {
    createPlayer: (state, {payload: {username, name, email, password, avatar}}) => {
      if (state.createdAt) throw new Error("The player already exists")
      if (!name) throw new Error("name is required")
      if (!email) throw new Error("email is required")
      if (!password) throw new Error("password is required")
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        throw new Error("email is invalid");
      return {
        type: PLAYER_CREATED,
        payload: {username, name, email, password: hashPassword(password), avatar}
      }
    },
    deletePlayer: (state, { aggregateId: playerId}) =>
    {
      const jwt = jsonwebtoken.verify(token, jwtSecret)
      validate.fieldRequired(jwt, 'id')
      if (jwt.id != playerId || !jwt.superuser)
        throw new Error("Only self or superuser can delete player")

      if (!state.createdAt)
        throw new Error('Player does not exist')
  
      return {
        type: PLAYER_DELETED
      }
    },
    registerWin: (state, {payload: { season, matchid, matchtype, score, coplayers, opponents, rank }}) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_WON_MATCH,
        payload: { season, matchid, matchtype, score, coplayers, opponents, rank }
      }
    },
    registerLoss: (state, {payload: { season, matchid, matchtype, score, coplayers, opponents, rank }}) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_LOST_MATCH,
        payload: { season, matchid, matchtype, score, coplayers, opponents, rank }
      }
    }
  }