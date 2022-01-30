const resolvers = {
  getById: async (store, { id: seasonid }) => {
    if (!seasonid)
      return []
    return await store.find('SeasonPlayers', { seasonid }, null, { rank: -1 })
  }
}
export default resolvers
