import { takeEvery, put } from 'redux-saga/effects'
import { internal } from '@resolve-js/redux'
const { SEND_COMMAND_SUCCESS } = internal.actionTypes
export function* optimisticVotingSaga() {
  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'createPlayer',
    function* (action) {
      yield put(optimisticUpvoteStory(action.command.aggregateId))
    }
  )
  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'unvoteStory',
    function* (action) {
      yield put(optimisticUnvoteStory(action.command.aggregateId))
    }
  )
}