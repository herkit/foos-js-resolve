const resolvers = {
  all: async (store) => {
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
    return await store.findOne('Players', { email })
  },
  getById: async (store, { id }) => {
    console.log('Players.getById', id)
    return await store.findOne('Players', { id })
  },
  autocomplete: async (store, { term }) => {
    var all = await store.find('Players', {}, null, { name: 1 })
    return all; /*.filter(i => i.name.indexOf(term) >= 0);*/
  }
}
export default resolvers
