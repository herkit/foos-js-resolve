import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { PlayerList } from '../components/PlayerList'
import { SingleMatchCreate } from '../components/SingleMatchCreate'
import { PlayerSelect } from '../components/PlayerSelect'
import { DoubleMatchCreate } from '../components/DoubleMatchCreate'
import { MatchRegistration } from '../components/MatchRegistration'
import { LeagueCreate } from '../components/LeagueCreate'
import { LeagueSelect } from '../components/LeagueSelect'

const App = () => {
  const staticResolver = useStaticResolver()
  const [league, setLeague] = useState()
  const bootstrapLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/style.css'),
  }
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/bootstrap.min.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.png'),
  }
  const links = [bootstrapLink, stylesheetLink, faviconLink]
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
      </Navbar>
      {(() => {
        if (league) {
          return <div className="content-wrapper">
            <PlayerList />
            <MatchRegistration league={league} />    
          </div>
        } 
        else 
        {
          return <div className="content-wrapper">
            <LeagueSelect onLeagueSelected={setLeague}></LeagueSelect>
            <LeagueCreate onCreateSuccess={(league) => setLeague(league)}></LeagueCreate>
          </div>
        }
      })()}        
    </div>
  )
}
export default App
