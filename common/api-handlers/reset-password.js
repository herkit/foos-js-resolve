import debugLevels from '@resolve-js/debug-levels'
import fetch from 'isomorphic-fetch'
import jsonwebtoken from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret';

const log = debugLevels("foosjs:api:aggregates:player")

export default async (req, res) => {
  const { email } = JSON.parse(req.body)

  if (!email)
    throw new Error("Email must be given")

  // look up user
  const defaultReadModelUrl = `http://${req.headers.host}${req.resolve.rootPath}/api/query/Players/email?email=${email}`
  log.debug(defaultReadModelUrl)
  const request = await fetch(defaultReadModelUrl)
  const { data: player } = await request.json()

  if (player && player.id) {
    const token = jsonwebtoken.sign({ id: player.id }, jwtSecret)
    log.debug(player, token)

    const commandsUrl = `http://${req.headers.host}${req.resolve.rootPath}/api/commands`

    const requestPasswordResetRequest = {
      aggregateId: player.id,
      aggregateName: "Player",
      type: "requestPasswordReset",
      payload: {
        email,
        token
      }
    };

    var response = await fetch(commandsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPasswordResetRequest)
    });

    log.debug(await response.json());
  } else {
    log.debug(`User not found: ${email}`)
  }

  res.status(202)
  res.end()
}
