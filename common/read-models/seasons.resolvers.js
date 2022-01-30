const resolvers = {
  getById: async (store, { id }) => {
    return await store.findOne('Seasons', { id })
  }
}
export default resolvers
