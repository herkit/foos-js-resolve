import debugLevels from '@resolve-js/debug-levels'
import _ from 'lodash'
import jsonwebtoken from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

const log = debugLevels('foosjs:read-models:players')

const resolvers = {
  all: async (store, query, { jwt: token }) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret);
    if (!jwt.superuser)
      throw new Error("Only superusers can request all player data")
    return await store.find('Players', {}, null, { name: 1 })
  },
  login: async (store, { email, password }) => {
    if (!email || !password)
      return null
    return await store.findOne('Players', { email, password })
  },
  email: async (store, { email }) => {
    if (!email)
      return null
    return await store.findOne('Players', { email }, { id: 1 })
  },
  getById: async (store, { id }) => {
    console.log('Players.getById', id)
    return await store.findOne('Players', { id })
  },
  autocomplete: async (store, { term }) => {
    const search = term.toLowerCase();
    var all = await store.find('Players', { }, { name: 1, id: 1 }, { name: 1 })
    //log.debug(all);
    var filtered = all.filter((n) => n.name.toLowerCase().indexOf( search) >= 0)
    log.debug(filtered);
    return filtered;
  }
}
export default resolvers
