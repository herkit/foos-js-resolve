const appConfig = {
  aggregates: [
    {
      name: "Player",
      commands: 'common/aggregates/player.commands.js',
      projection: 'common/aggregates/player.projection.js'
    }
  ],
  readModels: [
  ],
  viewModels: [
    {
      name: 'PlayerList',
      projection: 'common/view-models/player.projection.js',
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
