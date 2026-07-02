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
 *
 * reSolve view-models were live. These (LeagueData, PlayerSettings, PlayerName)
 * are eventually consistent — e.g. after creating a league its first season is
 * produced asynchronously by the LeagueCreation saga a moment later. So we poll
 * and push a new state only when it actually changes (avoids re-render churn),
 * which restores the reactive feel without a dedicated WebSocket per model.
 */
const VIEW_MODEL_POLL_MS = 3000

export const useViewModel = (name, aggregateIds, onState) => {
  let timer = null
  let lastSerialized

  const poll = async () => {
    try {
      const state = await fetchViewModel(name, aggregateIds[0])
      const serialized = JSON.stringify(state)
      if (serialized !== lastSerialized) {
        lastSerialized = serialized
        if (onState) onState(state)
      }
    } catch (e) {
      // transient; the next tick retries
    }
  }

  const connect = () => {
    void poll()
    timer = setInterval(poll, VIEW_MODEL_POLL_MS)
  }

  const dispose = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { connect, dispose }
}

/** Static assets are served from the site root, so the path passes through. */
export const useStaticResolver = () => (assetPath) => assetPath

/** Low-level client (a couple of components call this without using it). */
export const useClient = () => ({ command: executeCommand, query: executeQuery })

/** Bootstrap provider is a no-op passthrough now (see client/main.jsx). */
export const ResolveProvider = ({ children }) => children
