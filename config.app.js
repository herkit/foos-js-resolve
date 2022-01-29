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
    },
    {
      name: "League",
      commands: 'common/aggregates/league.commands.js',
      projection: 'common/aggregates/league.projection.js'
    }
  ],
  readModels: [
    {
      name: 'players',
      projection: 'common/read-models/players.projection.js',
      resolvers: 'common/read-models/players.resolvers.js',
      connectorName: 'default'
    },
    {
      name: 'Leagues',
      projection: 'common/read-models/leagues.projection.js',
      resolvers: 'common/read-models/leagues.resolvers.js',
      connectorName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'PlayerMatches',
      projection: 'common/view-models/player-matches.projection.js',
    },
  ],
  sagas: [
    {
      name: "PlayerRank",
      source: 'common/sagas/playerrank.saga.js',
      connectorName: 'default',
    },
    { 
      name: 'LeagueCreation', 
      source: 'common/sagas/league-creation.saga.js',
      connectorName: 'default'
    }
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
