import React from 'react'
import { Modal } from 'react-bootstrap'
import { Navigate, Route, Routes } from 'react-router'
import { LeagueBySlug } from './components/LeagueBySlug'
import { LeagueCreate } from './components/LeagueCreate'
import { LeagueSelect } from './components/LeagueSelect'
import { LeagueView } from './components/LeagueView'
import { Login } from './components/Login'
import PlayerCreate from './components/PlayerCreate'
import { PlayerList } from './components/PlayerList'
import App from './containers/App'
import SigninContainer from './containers/Signin'

const Error = () => {
  return (<div>Oops, something went wrong...</div>)
}

const AppRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={<SigninContainer />}>
        <Route path="" element={<LeagueSelect />} />
        <Route path="login" element={<Login />} />
      </Route>
      <Route path="/" element={<App />}>
        <Route path="error" element={<Error />} />
        <Route path="leagues" element={<LeagueSelect />} />
        <Route path="leagues/create" element={<LeagueCreate />} />
        <Route path="leagues/:slug" element={<LeagueBySlug />} />
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