import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import hashPassword from './passwordhash'

const API_GATEWAY_TIMEOUT = 30000
const routeLoginCallback = async ({ resolve }, username, password) => {
  const startTimestamp = Date.now()
  while (true) {
    try {
      const { data: user } = await resolve.executeQuery({
        modelName: 'Players',
        resolverName: 'login',
        resolverArgs: { email: username.trim(), password: hashPassword(password) },
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