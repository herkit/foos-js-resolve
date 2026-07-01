import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { jwtDecode } from 'jwt-decode'
import AppRoutes from './routes'
import { createAppStore } from './store'

// Vite SPA entry — replaces the reSolve SSR entry (client/index.js) and
// `createResolveStore`/`ResolveProvider` bootstrap. Auth state comes from the
// decoded `jwt` cookie, matching the original behaviour.
const getCookie = (name) =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]

let jwt = {}
try {
  const token = getCookie('jwt')
  if (token) jwt = jwtDecode(token)
} catch (e) {
  // no/invalid cookie -> anonymous
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
