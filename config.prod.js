import { declareRuntimeEnv } from '@resolve-js/scripts'
const prodConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
      emulateWorkerLifetimeLimit: 43200000
    },
  },
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-mysql',
      options: {
        host: declareRuntimeEnv('MYSQL_HOST', 'localhost'),
        port: declareRuntimeEnv('MYSQL_PORT', '3306'),
        user: declareRuntimeEnv('MYSQL_USER', 'customUser'),
        password: declareRuntimeEnv('MYSQL_PASSWORD', 'customPassword'),
        database: declareRuntimeEnv('MYSQL_DBNAME', 'readmodels')
      }
    }
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-mysql',
    options: {
      host: declareRuntimeEnv('EVENTSTORE_MYSQL_HOST', 'localhost'),
      port: declareRuntimeEnv('EVENTSTORE_MYSQL_PORT', '3306'),
      user: declareRuntimeEnv('EVENTSTORE_MYSQL_USER', 'customUser'),
      password: declareRuntimeEnv('EVENTSTORE_MYSQL_PASSWORD', 'customPassword'),
      database: declareRuntimeEnv('EVENTSTORE_MYSQL_DBNAME', 'events')
    }
},
  /*
      {
        module: '@resolve-js/eventstore-mysql',
        options: {
          host: 'localhost',
          port: 3306,
          user: 'customUser',
          password: 'customPassword',
          database: 'customDatabaseName',
          eventsTableName: 'customTableName',
          secretsDatabase: 'customSecretsDatabaseName',
          secretsTableName: 'customSecretsTableName'
        }
      }
    */ jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}
export default prodConfig
