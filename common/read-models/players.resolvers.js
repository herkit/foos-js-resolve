const resolvers = {
  all: async (store) => {
    return await store.find('Players', {})
  },
}
export default resolvers
