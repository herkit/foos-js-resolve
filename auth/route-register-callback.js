import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import { v4 as uuid } from 'uuid'
import hashPassword from './passwordhash'
const routeRegisterCallback = async ({ resolve }, username, password) => {
  const { data: existingUser } = await resolve.executeQuery({
    modelName: 'Players',
    resolverName: 'email',
    resolverArgs: { email: username.trim() },
  })
  if (existingUser) {
    throw new Error('User cannot be created')
  }
  const user = {
    email: username.trim(),
    name: username.trim(),
    password: hashPassword(password),
    id: uuid(),
  }
  await resolve.executeCommand({
    type: 'createPlayer',
    aggregateId: user.id,
    aggregateName: 'Player',
    payload: user,
  })
  return jwt.sign(user, jwtSecret)
}
export default routeRegisterCallback