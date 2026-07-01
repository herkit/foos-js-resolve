import { createStore, combineReducers } from 'redux'

// --- action types ---
export const READ_MODEL_REQUEST = 'READ_MODEL_REQUEST'
export const READ_MODEL_SUCCESS = 'READ_MODEL_SUCCESS'
export const READ_MODEL_FAILURE = 'READ_MODEL_FAILURE'
export const VIEW_MODEL_STATE = 'VIEW_MODEL_STATE'

// --- action creators ---
export const readModelRequest = (selectorId) => ({ type: READ_MODEL_REQUEST, selectorId })
export const readModelSuccess = (selectorId, data) => ({ type: READ_MODEL_SUCCESS, selectorId, data })
export const readModelFailure = (selectorId, error) => ({ type: READ_MODEL_FAILURE, selectorId, error })
export const viewModelState = (key, data, status = 'ready') => ({ type: VIEW_MODEL_STATE, key, data, status })

// --- reducers ---
const jwt = (state = {}) => state

const readModels = (state = {}, action) => {
  switch (action.type) {
    case READ_MODEL_REQUEST:
      return { ...state, [action.selectorId]: { status: 'requested', data: state[action.selectorId]?.data ?? [] } }
    case READ_MODEL_SUCCESS:
      return { ...state, [action.selectorId]: { status: 'ready', data: action.data ?? [] } }
    case READ_MODEL_FAILURE:
      return { ...state, [action.selectorId]: { status: 'failed', data: [], error: action.error } }
    default:
      return state
  }
}

const viewModels = (state = {}, action) => {
  switch (action.type) {
    case VIEW_MODEL_STATE:
      return { ...state, [action.key]: { status: action.status, data: action.data } }
    default:
      return state
  }
}

export const READ_MODEL_DEFAULT = { status: 'initial', data: [] }
export const VIEW_MODEL_DEFAULT = { status: 'initial', data: null }

export const createAppStore = (preloadedState = {}) =>
  createStore(combineReducers({ jwt, readModels, viewModels }), preloadedState)
