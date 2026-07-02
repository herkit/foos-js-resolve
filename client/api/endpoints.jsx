// Maps reSolve command/query/view-model identifiers onto the NestJS REST + WS
// API. This is the single place that knows the endpoint layout.
import { apiGet, apiPost, apiPut, apiDelete } from './client'

/**
 * Execute a reSolve-style command `{ type, aggregateId, aggregateName, payload }`.
 * Returns `{ aggregateId, payload }` (what the reSolve callbacks consumed).
 */
export const executeCommand = async ({ type, aggregateId, aggregateName, payload = {} }) => {
  const id = encodeURIComponent(aggregateId)
  switch (`${aggregateName}.${type}`) {
    case 'Player.createPlayer':
      await apiPost(`/players/${id}`, payload)
      break
    case 'Player.deletePlayer':
      await apiDelete(`/players/${id}`)
      break
    case 'Player.setDefaultLeague':
      await apiPut(`/players/${id}/default-league`, payload)
      break
    case 'Player.resetDefaultLeague':
      await apiDelete(`/players/${id}/default-league`)
      break
    case 'Player.changeEmail':
      await apiPost(`/players/${id}/email-change`, payload)
      break
    case 'League.createLeague':
      await apiPost(`/leagues/${id}`, payload)
      break
    case 'Season.createSeason':
      await apiPost(`/seasons/${id}`, payload)
      break
    case 'Season.registerMatch':
      await apiPost(`/seasons/${id}/matches`, payload)
      break
    default:
      throw new Error(`Unknown command ${aggregateName}.${type}`)
  }
  return { aggregateId, payload }
}

/**
 * Execute a reSolve-style read-model query `{ name, resolver, args }`.
 * Returns `{ data }` (matching the reSolve query result shape).
 */
export const executeQuery = async ({ name, resolver, args = {} }) => {
  const key = `${name}.${resolver}`
  switch (key) {
    case 'Players.all':
    case 'Players.autocomplete':
      return { data: await apiGet('/players') }
    case 'Players.allNames':
      return { data: await apiGet('/players/names') }
    case 'Players.getById':
      return { data: await apiGet(`/players/${encodeURIComponent(args.id)}`) }
    case 'Players.email':
      return { data: await apiGet(`/players/by-email?email=${encodeURIComponent(args.email)}`) }
    case 'Leagues.all':
      return { data: await apiGet('/leagues') }
    case 'Leagues.getById':
      return { data: await apiGet(`/leagues/${encodeURIComponent(args.id)}`) }
    case 'Leagues.getBySlug':
      return { data: await apiGet(`/leagues/by-slug?slug=${encodeURIComponent(args.slug)}`) }
    default:
      throw new Error(`Unknown query ${key}`)
  }
}

/**
 * Fetch the current state of a view-model for the given aggregate id, adapting
 * the read-model responses to the shapes the original view-models produced.
 */
export const fetchViewModel = async (name, aggregateId) => {
  switch (name) {
    case 'SeasonRanks':
      return apiGet(`/seasons/${encodeURIComponent(aggregateId)}/ranks`)
    case 'LeagueData':
      return apiGet(`/leagues/${encodeURIComponent(aggregateId)}`)
    case 'PlayerSettings': {
      const player = await apiGet(`/players/${encodeURIComponent(aggregateId)}`)
      return {
        name: player?.name,
        deleted: !player,
        settings: { defaultLeague: player?.defaultLeague },
      }
    }
    case 'PlayerName': {
      const player = await apiGet(`/players/${encodeURIComponent(aggregateId)}`)
      return { name: player?.name ?? 'Unknown Player', deleted: !player }
    }
    default:
      throw new Error(`Unknown view-model ${name}`)
  }
}
