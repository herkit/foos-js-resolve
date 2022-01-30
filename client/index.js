import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

const entryPoint = (clientContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveProvider context={clientContext}>
      <BrowserRouter>
        <AppRoutes></AppRoutes>
      </BrowserRouter>
    </ResolveProvider>,
    appContainer
  )
}
export default entryPoint
