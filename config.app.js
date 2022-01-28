const appConfig = {
  aggregates: [
    {
      name: "Player",
      commands: 'common/aggregates/player.commands.js',
      projection: 'common/aggregates/player.projection.js'
    },
    {
      name: "Match",
      commands: 'common/aggregates/match.commands.js',
      projection: 'common/aggregates/match.projection.js'
    }
  ],
  readModels: [
    {
      name: 'players',
      projection: 'common/read-models/players.projection.js',
      resolvers: 'common/read-models/players.resolvers.js',
      connectorName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'PlayerMatches',
      projection: 'common/view-models/player-matches.projection.js',
    },
  ],
  clientEntries: [
    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}
export default appConfig
