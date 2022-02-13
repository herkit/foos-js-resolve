import { PLAYER_PASSWORD_RESET_FORGOTTEN, PLAYER_PASSWORD_RESET_REQUESTED, PLAYER_PASSWORD_RESET_RESPONDED } from '../event-types'
import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'
import crypto from 'crypto'
import { sendMail } from '../../mailer'


import debugLevels from '@resolve-js/debug-levels'
const log = debugLevels("foosjs:saga:passwordreset")

export default {
  handlers: {
    Init: async ({ store }) => {
      log.debug("Password Reset Saga init")
      await store.defineTable('PasswordResetRequests', {
        indexes: { handle: 'string', email: 'string' },
        fields: [ 'id', 'requestedAt', 'token' ],
      })
      log.debug("Store table created")
    },
    [PLAYER_PASSWORD_RESET_REQUESTED]: async ({store, sideEffects}, { aggregateId: id, timestamp: requestedAt, payload: { email } }) => {
      log.debug("Password reset requested")
      const token = jwt.sign({ action: "passwordreset", id }, jwtSecret)
      const handle = crypto.randomBytes(6).toString('base64').split("=")[0].replace('+', '-').replace('/', '_')
      await store.delete('PasswordResetRequests', { email })
      await store.insert('PasswordResetRequests', { handle, id, email, requestedAt, token });
      log.debug("Sending email")
      log.debug(sideEffects)
      await sideEffects.sendMail({
        from: 'info@foos.app',
        to: email,
        subject: "Password reset requested",
        text: `You (or someone else) has requested a password reset for your foos.app account.\r\n\r\nOpen https://foos.app/passwordreset/${handle} to reset your password`
      });
      log.debug("Email sent")
      log.debug("Scheduling forget")
      await sideEffects.scheduleCommand(requestedAt + 60000 /*3600000*/, {
        aggregateName: "Player",
        aggregateId: id,
        type: "forgetPasswordReset",
        payload: {
          handle
        }
      });
      log.debug("Forget scheduled")
    },
    [PLAYER_PASSWORD_RESET_RESPONDED]: async ({store, sideEffects}, { payload: { handle, password }}) => {
      const reset = await store.findOne('PasswordResetRequests', { handle })
      await sideEffects.executeCommand({
        aggregateName: "Player",
        aggregateId: reset.id,
        type: "changePassword",
        payload: { password, token: reset.token }
      })
      await store.delete('PasswordResetRequests', { handle })
    },
    [PLAYER_PASSWORD_RESET_FORGOTTEN]: async ({store}, { payload: { handle }}) => {
      await store.delete('PasswordResetRequests', { handle })
    }
  },
  sideEffects: {
    sendMail
  },
}