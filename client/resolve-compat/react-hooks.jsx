// Drop-in replacement for `@resolve-js/react-hooks`, backed by the NestJS API.
// Aliased to this file in vite.config.js so component imports stay unchanged.
import { executeCommand, executeQuery, fetchViewModel } from '../api/endpoints'

/** useCommand(command, callback?) -> execute function. */
export const useCommand = (command, callback) => {
  return async () => {
    try {
      const result = await executeCommand(command)
      if (callback) callback(null, result)
      return result
    } catch (error) {
      if (callback) callback(error)
      else throw error
      return undefined
    }
  }
}

/** useQuery({ name, resolver, args }, callback?) -> fetch function. */
export const useQuery = (query, callback) => {
  return async () => {
    try {
      const result = await executeQuery(query)
      if (callback) callback(null, result)
      return result
    } catch (error) {
      if (callback) callback(error)
      else throw error
      return undefined
    }
  }
}

/**
 * useViewModel(name, aggregateIds, onState) -> { connect, dispose }.
 * Non-reactive view-models (LeagueData, PlayerSettings, PlayerName): fetch once
 * on connect. The reactive SeasonRanks path lives in the redux shim.
 */
export const useViewModel = (name, aggregateIds, onState) => {
  const connect = async () => {
    const state = await fetchViewModel(name, aggregateIds[0])
    if (onState) onState(state)
  }
  return { connect, dispose: () => {} }
}

/** Static assets are served from the site root, so the path passes through. */
export const useStaticResolver = () => (assetPath) => assetPath

/** Low-level client (a couple of components call this without using it). */
export const useClient = () => ({ command: executeCommand, query: executeQuery })

/** Bootstrap provider is a no-op passthrough now (see client/main.jsx). */
export const ResolveProvider = ({ children }) => children
