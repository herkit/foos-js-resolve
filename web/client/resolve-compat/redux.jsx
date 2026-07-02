// Drop-in replacement for `@resolve-js/redux`, backed by the NestJS API + a
// standard redux store. Aliased in vite.config.js so imports stay unchanged.
import React, { useCallback, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { executeQuery, fetchViewModel } from '../api/endpoints'
import {
  createAppStore,
  readModelRequest,
  readModelSuccess,
  readModelFailure,
  viewModelState,
  READ_MODEL_DEFAULT,
  VIEW_MODEL_DEFAULT,
} from '../store'

const readModelSelectorId = (query, options) => {
  if (options && !Array.isArray(options) && options.selectorId) return options.selectorId
  return `${query.name}.${query.resolver}`
}

/** useReduxReadModel(query, args, options) -> { request, selector }. */
export const useReduxReadModel = (query, _args, options) => {
  const dispatch = useDispatch()
  const selectorId = readModelSelectorId(query, options)

  const request = useCallback(async () => {
    dispatch(readModelRequest(selectorId))
    try {
      const result = await executeQuery(query)
      dispatch(readModelSuccess(selectorId, result.data))
    } catch (error) {
      dispatch(readModelFailure(selectorId, error))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selectorId, JSON.stringify(query)])

  const selector = (state) => state.readModels[selectorId] ?? READ_MODEL_DEFAULT
  return { request, selector }
}

/** useReduxReadModelSelector(selectorId) -> { status, data }. */
export const useReduxReadModelSelector = (selectorId) =>
  useSelector((state) => state.readModels[selectorId] ?? READ_MODEL_DEFAULT)

/**
 * useReduxViewModel({ name, aggregateIds }) -> { connect, dispose, selector }.
 * SeasonRanks is reactive over the socket.io gateway; others fetch once.
 */
export const useReduxViewModel = ({ name, aggregateIds }) => {
  const dispatch = useDispatch()
  const key = `${name}:${aggregateIds.join(',')}`
  const socketRef = useRef(null)

  const connect = useCallback(async () => {
    if (name === 'SeasonRanks') {
      // Default namespace + default /socket.io path (Vite proxies it in dev).
      const socket = io({ withCredentials: true })
      socketRef.current = socket
      socket.on('ranks', (data) => dispatch(viewModelState(key, data)))
      socket.on('connect', () => socket.emit('subscribeSeason', aggregateIds[0]))
    } else {
      const data = await fetchViewModel(name, aggregateIds[0])
      dispatch(viewModelState(key, data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, key])

  const dispose = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const selector = (state) => state.viewModels[key] ?? VIEW_MODEL_DEFAULT
  return { connect, dispose, selector }
}

/** Bootstrap helpers (see client/main.jsx). */
export const createResolveStore = (_context, { initialState = {} } = {}) =>
  createAppStore(initialState)

export const ResolveReduxProvider = ({ store, children }) => (
  <Provider store={store}>{children}</Provider>
)

// Referenced by the (unused) optimistic saga; kept so imports resolve.
export const internal = { actionTypes: { SEND_COMMAND_SUCCESS: 'SEND_COMMAND_SUCCESS' } }
