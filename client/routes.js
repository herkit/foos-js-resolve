import React from 'react'
import { Modal } from 'react-bootstrap'
import { Route, Routes } from 'react-router'
import { LeagueCreate } from './components/LeagueCreate'
import { LeagueSelect } from './components/LeagueSelect'
import { LeagueView } from './components/LeagueView'
import { Login } from './components/Login'
import PlayerCreate from './components/PlayerCreate'
import { PlayerList } from './components/PlayerList'
import App from './containers/App'

const AppRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="" element={<LeagueCreate></LeagueCreate>} />
        <Route path="login" element={<Login></Login>} />
        <Route path="leagues" element={<LeagueSelect />} />
        <Route path="leagues/create" element={<LeagueCreate />} />
        <Route path="leagues/:id" element={<LeagueView />} />
        <Route path="players" element={<PlayerList />}>
          <Route path="create" element={
            <Modal backdrop="static" show="true">
              <Modal.Header closeButton>
                <Modal.Title>Create Player</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <PlayerCreate></PlayerCreate>
              </Modal.Body>
            </Modal>} />
        </Route>
      </Route>
    </Routes>
  )
}


export default AppRoutes