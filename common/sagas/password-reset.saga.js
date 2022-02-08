import { v4 as uuid } from 'uuid'
import { PLAYER_PASSWORD_RESET_REQUESTED, PLAYER_PASSWORD_RESET_RESPONDED } from '../event-types'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('')
      await store.defineTable('PasswordResetRequests', {
        indexes: { handle: string },
        fields: [ 'playerid', 'email', 'requestedAt', 'token' ],
      })
    },
    [PLAYER_PASSWORD_RESET_REQUESTED]: async ({store, sideEffects}, { aggregateId: playerid, timestamp: requestedAt, payload: { email } }) => {
      const token = jwt.sign({ action: "passwordreset", playerid }, jwtSecret)
      const handle = crypto.randomBytes(6).toString('base64').split("=")[0].replace('+', '-').replace('/', '_')
      await store.insert('PasswordResetRequests', {  handle, playerid, email, requestedAt, token });
      await sideEffects.sendEmail(email, "Password reset requested", `You (or someone else) has requested a password reset for your foos.app account.\r\n\r\nOpen https://foos.app/passwordreset/${handle} to reset your password`);
    },
    [PLAYER_PASSWORD_RESET_RESPONDED]: async ({sideEffects}, { aggregateId, payload: { handle, password }}) => {
      const reset = await store.findOne('PasswordResetRequests', { handle })
      await store.delete('PasswordResetRequests', { handle })
      await sideEffects.executeCommand({
        aggregateName: "Player",
        aggregateId: reset.playerid,
        type: "changePassword",
        payload: { password, token: reset.token },
        jwt: reset.token
      })
    }
  },
  sideEffects: {
    sendEmail: (email, subject, body) => {
      // eslint-disable-next-line no-console
      console.log(`<${email}> ${subject}: ${body}`)
    },
  },
}