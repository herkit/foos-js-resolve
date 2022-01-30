const resolvers = {
  all: async (store) => {
    return await store.find('Players', {}, null, { name: 1 })
  },
  getById: async (id) => {
    return await store.findOne('Players', { id }, null)
  },
  autocomplete: async (store, { term }) => {
    var all = await store.find('Players', {}, null, { name: 1 })
    return all; /*.filter(i => i.name.indexOf(term) >= 0);*/
  }
}
export default resolvers
