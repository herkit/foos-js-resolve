import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import LoggedInContent from '../components/LoggedInContent'
import { LoginInfo } from '../components/LoginInfo'

const App = () => {
  const staticResolver = useStaticResolver()
  const bootstrapLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/style.css'),
  }
  const scoreboardLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/scoreboard.css'),
  }  
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/solar.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.png'),
  }
  const links = [bootstrapLink, stylesheetLink, scoreboardLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }
  return (
    <div>
      <Helmet title="Foos" link={links} meta={[meta]} />
      <header className='p-3 bg-dark text-white mb-4'>
        <div className='container'>
          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3">
            <a href='/' className='d-flex align-items-center col-md-3 mb-2 mb-md-0 text-white text-decoration-none navbar-brand'>Foos</a>
            <ul className="nav col-6 col-md-auto justify-content-center mb-md-0">
              <li>
                <Link to={`/leagues`} className="nav-link px-2">Leagues</Link>
              </li>
              
              <LoggedInContent requireSuperuser={true} showLoginLink={false}>
                <li>
                  <Link to={`/players`} className="nav-link px-2">Players</Link>
                </li>
              </LoggedInContent>
            </ul>
            <div className="col-md-3 text-end">
              <LoginInfo></LoginInfo>
            </div>
          </div>
        </div>
      </header>
      <div className="container">
        <Outlet></Outlet>
      </div>
    </div>
  )
}
export default App
