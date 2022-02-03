import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import getRedux from './get-redux'

const entryPoint = (clientContext) => {
  const appContainer = document.createElement('div')
  const redux = getRedux(clientContext.clientImports, history)
  const store = createResolveStore(clientContext, {
    serializedState: (window).__INITIAL_STATE__,
    redux,
  })
  document.body.appendChild(appContainer)
  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <BrowserRouter>
        <AppRoutes></AppRoutes>
      </BrowserRouter>
    </ResolveReduxProvider>,
    appContainer
  )
}
export default entryPoint
