import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import { v4 as uuid } from 'uuid'
import hashPassword from './passwordhash'

const extractName = (email) => {
  var name = email
    .match(/^([^@]*)@/)[1]
    .replace(/[0-9!#$%&'*+/=?^_`{|}~\.]/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/(?<=\W|^)\w/g, (r) => r.toUpperCase());
  return name;
}

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
    name: extractName(username).trim(),
    password: password,
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