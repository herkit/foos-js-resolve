const resolvers = {
  all: async (store) => {
    return await store.find('Leagues', {}, null, { name: 1 })
  },
  getById: async (store, { id }) => {
    return await store.findOne('Leagues', { id })
  }
}
export default resolvers
