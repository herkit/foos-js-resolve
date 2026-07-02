import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import AppRoutes from './routes'
import { createAppStore } from './store'
import { apiGet } from './api/client'

// Vite SPA entry — replaces the reSolve SSR entry (client/index.js) and the
// `createResolveStore`/`ResolveProvider` bootstrap.
//
// The `jwt` session cookie is httpOnly (not readable via document.cookie), so we
// ask the server who's authenticated via /auth/me and seed the redux `jwt` state
// with the returned claims (anonymous {} on 401).
async function bootstrap() {
  let jwt = {}
  try {
    jwt = (await apiGet('/auth/me')) ?? {}
  } catch (e) {
    jwt = {} // 401 / not authenticated
  }

  const store = createAppStore({ jwt })

  render(
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>,
    document.getElementById('root'),
  )
}

void bootstrap()
