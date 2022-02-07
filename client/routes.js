import React from 'react'
import { Modal } from 'react-bootstrap'
import { Navigate, Route, Routes } from 'react-router'
import { Intro } from './components/Intro'
import { LeagueBySlug } from './components/LeagueBySlug'
import { LeagueCreate } from './components/LeagueCreate'
import { LeagueSelect } from './components/LeagueSelect'
import { LeagueView } from './components/LeagueView'
import { Login } from './components/Login'
import PlayerCreate from './components/PlayerCreate'
import { PlayerList } from './components/PlayerList'
import App from './containers/App'
import SigninContainer from './containers/Signin'
import { useLocation } from 'react-router-dom'
import { AuthForm } from './components/AuthForm'

const Error = () => {
  return (<div>Oops, something went wrong...</div>)
}

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<SigninContainer />}>
        <Route path="" element={<Intro />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<AuthForm
            buttonText="Create account"
            action={`/api/register${location.search}`}
            title="Create account"
          />}/>
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