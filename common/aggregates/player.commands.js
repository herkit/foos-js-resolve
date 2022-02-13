import jsonwebtoken from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret';
import hashPassword from "../../auth/passwordhash";
import validate from './validation'
import { 
  PLAYER_CREATED,
  PLAYER_DELETED, 
  PLAYER_WON_MATCH,
  PLAYER_LOST_MATCH,
  PLAYER_SET_DEFAULT_LEAGUE,
  PLAYER_PASSWORD_RESET_REQUESTED 
} from "../event-types";
export default {
    createPlayer: (state, {payload: {username, name, email, password, avatar}}) => {
      if (state.createdAt) throw new Error("The player already exists")
      if (!name) throw new Error("name is required")
      if (!email) throw new Error("email is required")
      if (!password) throw new Error("password is required")
      if (!/^\w+([\+\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        throw new Error("email is invalid");
      return {
        type: PLAYER_CREATED,
        payload: {username, name, email, password: hashPassword(password), avatar}
      }
    },
    deletePlayer: (state, { aggregateId: playerId}, { jwt: token }) =>
    {
      const jwt = jsonwebtoken.verify(token, jwtSecret)
      validate.fieldRequired(jwt, 'id')
      if (jwt.id != playerId && !jwt.superuser)
        throw new Error("Only self or superuser can delete player")
      if (!state.createdAt)
        throw new Error('Player does not exist')
  
      return {
        type: PLAYER_DELETED
      }
    },
    requestPasswordReset: (state, { aggregateId, payload: { token, email } }) => {
      const jwt = jsonwebtoken.verify(token, jwtSecret)
      if (jwt.id != aggregateId)
        throw new Error("Token must match aggregate")

      return {
        type: PLAYER_PASSWORD_RESET_REQUESTED,
        payload: { email }
      }
    },
    forgetPasswordReset: (state, { payload: { handle }}) => {
      return {
        type: PLAYER_PASSWORD_RESET_FORGOTTEN,
        payload: {
          handle
        }
      }
    },
    changePassword: (state, { aggregateId, payload: { token, password }}, { jwt }) => {
      const verifiedToken = token ? jsonwebtoken.verify(token, jwtSecret) : jsonwebtoken.verify(jwt, jwtSecret)     
      
      if (verifiedToken.id !== aggregateId)
        throw new Error('Token does not match player')

      return {
        type: PLAYER_PASSWORD_CHANGED,
        payload: { password }
      }
    },
    setDefaultLeague: (state, { payload: { id, slug }}) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_SET_DEFAULT_LEAGUE,
        payload: { id, slug }
      }
    },
    resetDefaultLeague: (state) => {
      if (!state.createdAt)
        throw new Error('Player does not exist')

      return {
        type: PLAYER_SET_DEFAULT_LEAGUE,
        payload: { id: undefined, slug: undefined }
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