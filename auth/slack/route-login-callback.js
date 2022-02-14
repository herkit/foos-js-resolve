import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import hashPassword from './passwordhash'

const API_GATEWAY_TIMEOUT = 1500
const routeLoginCallback = async ({ resolve }, accessToken, refreshToken, profile) => {
  const startTimestamp = Date.now()
  while (true) {
    try {
      console.log(profile)
      const { data: user } = await resolve.executeQuery({
        modelName: 'Players',
        resolverName: 'email',
        resolverArgs: { email: profile.email },
      })

      if (!user) {
        throw new Error('Incorrect "username" or "password"')
      }
      return jwt.sign({ name: user.name, email: user.email, id: user.id, superuser: user.isSuperuser }, jwtSecret)
    } catch (error) {
      if (Date.now() - startTimestamp > API_GATEWAY_TIMEOUT) {
        throw error
      }
    }
  }
}
export default routeLoginCallback