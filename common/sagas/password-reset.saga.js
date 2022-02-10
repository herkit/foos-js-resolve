import { PLAYER_PASSWORD_RESET_REQUESTED, PLAYER_PASSWORD_RESET_RESPONDED } from '../event-types'
import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('')
      await store.defineTable('PasswordResetRequests', {
        indexes: { handle: string },
        fields: [ 'id', 'email', 'requestedAt', 'token' ],
      })
    },
    [PLAYER_PASSWORD_RESET_REQUESTED]: async ({store, sideEffects}, { aggregateId: id, timestamp: requestedAt, payload: { email } }) => {
      const token = jwt.sign({ action: "passwordreset", id }, jwtSecret)
      const handle = crypto.randomBytes(6).toString('base64').split("=")[0].replace('+', '-').replace('/', '_')
      await store.insert('PasswordResetRequests', {  handle, id, email, requestedAt, token });
      await sideEffects.scheduleCommand(new Date() + 3600000, {
        aggregateName: "Player",
        aggregateId: id,
        type: "forgetPasswordReset",
        payload: {
          handle
        }
      });
      await sideEffects.sendEmail(email, "Password reset requested", `You (or someone else) has requested a password reset for your foos.app account.\r\n\r\nOpen https://foos.app/passwordreset/${handle} to reset your password`);
    },
    [PLAYER_PASSWORD_RESET_RESPONDED]: async ({sideEffects}, { payload: { handle, password }}) => {
      const reset = await store.findOne('PasswordResetRequests', { handle })
      await sideEffects.executeCommand({
        aggregateName: "Player",
        aggregateId: reset.id,
        type: "changePassword",
        payload: { password, token: reset.token }
      })
      await store.delete('PasswordResetRequests', { handle })
    }
  },
  sideEffects: {
    sendEmail: (email, subject, body) => {
      // eslint-disable-next-line no-console
      console.log(`<${email}> ${subject}: ${body}`)
    },
  },
}