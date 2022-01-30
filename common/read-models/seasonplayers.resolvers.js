const resolvers = {
  getById: async (store, { seasonid }) => {
    return await store.find('SeasonPlayers', { seasonid }, null, { rank: -1 })
  }
}
export default resolvers
