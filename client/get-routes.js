import React from 'react'
import { Modal } from 'react-bootstrap'
import { LeagueBySlug } from './components/LeagueBySlug'
import { LeagueCreate } from './components/LeagueCreate'
import { LeagueSelect } from './components/LeagueSelect'
import { Login } from './components/Login'
import PlayerCreate from './components/PlayerCreate'
import { PlayerList } from './components/PlayerList'
import App from './containers/App'
import SigninContainer from './containers/Signin'

const Error = () => {
  return (<div>Oops, something went wrong...</div>)
}

const CreatePlayerDialog = () => {
  return (<Modal backdrop="static" show="true">
  <Modal.Header closeButton>
    <Modal.Title>Create Player</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <PlayerCreate></PlayerCreate>
  </Modal.Body>
</Modal>)
}


const routes = [
  { path: '/',
    component: SigninContainer,
    children: [
      {
        path: '',
        component: LeagueSelect
      },
      {
        path: 'login',
        component: Login
      }
    ]
  },
  {
    path: '/',
    component: App,
    children: [
      {
        path: 'error',
        component: Error,
      },
      {
        path: 'leagues',
        component: LeagueSelect
      },
      {
        path: 'leagues/create',
        component: LeagueCreate
      },
      {
        path: 'leagues/:slug',
        component: LeagueBySlug
      },
      {
        path: 'players',
        component: PlayerList,
        children: [
          {
            path: 'create',
            component: CreatePlayerDialog
          }
        ]
      }
    ]
  }
]

const getRoutes = () => routes
export { getRoutes }