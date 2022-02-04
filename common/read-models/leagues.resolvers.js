const resolvers = {
  all: async (store) => {
    return await store.find('Leagues', {}, null, { name: 1 })
  },
  getById: async (store, { id }) => {
    return await store.findOne('Leagues', { id })
  },
  getBySlug: async (store, { slug }) => {
    return await store.findOne('Leagues', { slug })
  }
}
export default resolvers
