import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  reset,
  stop,
} from '@resolve-js/scripts'
import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import resolveModuleAdmin from '@resolve-js/module-admin'
import resolveModuleAuth from '@resolve-js/module-auth'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'
const launchMode = process.argv[2]
void (async () => {
  try {
    const moduleAuth = resolveModuleAuth([
      {
        name: 'local-strategy',
        createStrategy: 'auth/create-strategy.js',
        logoutRoute: {
          path: 'logout',
          method: 'POST',
        },
        routes: [
          {
            path: 'register',
            method: 'POST',
            callback: 'auth/route-register-callback.js',
          },
          {
            path: 'login',
            method: 'POST',
            callback: 'auth/route-login-callback.js',
          },
        ],
      },
    ])
    const baseConfig = merge(
      defaultResolveConfig,
      appConfig,
      moduleAuth
    )
    switch (launchMode) {
      case 'dev': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(baseConfig, devConfig, moduleAdmin)
        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }
      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        break
      }
      case 'build': {
        await build(
          merge(baseConfig, prodConfig),
          adjustWebpackConfigs
        )
        break
      }
      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }
      case 'cloud': {
        await build(
          merge(baseConfig, cloudConfig),
          adjustWebpackConfigs
        )
        break
      }
      case 'test:e2e': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          baseConfig,
          testFunctionalConfig,
          moduleAdmin
        )
        await reset(
          resolveConfig,
          {
            dropEventStore: true,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
          functionalTestsDir: 'test/e2e',
          browser: process.argv[3],
          customArgs: ['--stop-on-first-fail'],
        })
        break
      }
      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
