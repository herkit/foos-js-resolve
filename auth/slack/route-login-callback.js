import jwt from 'jsonwebtoken'
import jwtSecret from '../jwt-secret'
import { v4 as uuid } from 'uuid'

import debugLevels from '@resolve-js/debug-levels'
const log = debugLevels('foosjs:auth:slack:route-login-callback')

const routeLoginCallback = async ({ resolve }, accessToken, refreshToken, profile) => {
  console.log(profile)
  const { data: user } = await resolve.executeQuery({
    modelName: 'Players',
    resolverName: 'email',
    resolverArgs: { email: profile.user.email },
  })
  if (user) {
    log.debug("User found, logging in", user)
    return jwt.sign({ 
      name: user.name, 
      email: user.email, 
      id: user.id, 
      superuser: user.isSuperuser, 
      method: "slack", 
      avatar: profile.user.image_192,
      slackid: profile.user.id
    }, jwtSecret)
  }
  else
  {
    log.debug("User not found, creating new user")
    const createdUser = {
      email: profile.user.email,
      name: profile.user.name,
      id: uuid(),
    }        
    await resolve.executeCommand({
      type: 'createPlayer',
      aggregateId: createdUser.id,
      aggregateName: 'Player',
      payload: createdUser,
    })
    return jwt.sign({ 
      name: createdUser.name,
      email: createdUser.email, 
      id: createdUser.id, 
      method: "slack", 
      avatar: profile.user.image_192,
      slackid: profile.user.id
    }, jwtSecret)
  }
}
export default routeLoginCallback