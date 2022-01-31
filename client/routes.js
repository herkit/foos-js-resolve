import React from 'react'
import { Route, Routes } from 'react-router'
import { LeagueCreate } from './components/LeagueCreate'
import { LeagueSelect } from './components/LeagueSelect'
import { LeagueView } from './components/LeagueView'
import App from './containers/App'

const AppRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="" element={<LeagueCreate></LeagueCreate>} />
        <Route path="leagues" element={<LeagueSelect />} />
        <Route path="leagues/:id" element={<LeagueView />} />
      </Route>
    </Routes>
  )
}


export default AppRoutes