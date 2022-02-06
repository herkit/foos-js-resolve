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
    },
    {
      name: "Season",
      commands: 'common/aggregates/season.commands.js',
      projection: 'common/aggregates/season.projection.js'
    }
  ],
  readModels: [
    {
      name: 'Players',
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
    {
      name: 'PlayerName',
      projection: 'common/view-models/player-names.projection.js',
    },
    {
      name: 'PlayerSettings',
      projection: 'common/view-models/player-settings.projection.js',
    },
    {
      name: 'LeagueData',
      projection: 'common/view-models/league.projection.js',
    },
    {
      name: 'SeasonRanks',
      projection: 'common/view-models/season-ranks.projection.js'
    }
  ],
  sagas: [
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
    [
      'client/ssr.js',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr.js',
      {
        outputFile: 'common/cloud-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}
export default appConfig
