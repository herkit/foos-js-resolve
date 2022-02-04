import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'

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
    href: staticResolver('/bootstrap.css'),
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
      <Navbar>
        <Navbar.Brand href="#home">
          <Image
            src={staticResolver('/resolve-logo.png')}
            className="d-inline-block align-top"
          />
          <span>{'Foos'}</span>
        </Navbar.Brand>
        <Link to={`/leagues`} className="p-2">Leagues</Link>
        <Link to={`/players`} className="p-2">Players</Link>
      </Navbar>
      <div className="container">
        <Outlet></Outlet>
      </div>
    </div>
  )
}
export default App
