import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import getRedux from './get-redux'
import jsonwebtoken from 'jsonwebtoken'

const getCookie = (cookieName) => {
  return document.cookie
  .split('; ')
  .find(row => row.startsWith(cookieName + '='))
  .split('=')[1];
}

const entryPoint = (clientContext, req) => {
  /*const { constants, seedClientEnvs, utils, viewModels } = clientContext
  const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils*/
  const { jwtCookie } = clientContext
  const appContainer = document.createElement('div')
  const redux = getRedux(clientContext.clientImports, history)
  const jwt = {}
  try {
    Object.assign(jwt, jsonwebtoken.decode(getCookie(jwtCookie.name)))
  } catch (e) {}
  const store = createResolveStore(clientContext, {
    initialState: { jwt },
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
