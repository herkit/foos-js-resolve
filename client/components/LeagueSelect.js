import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LeagueCreate } from './LeagueCreate'
import { useSelector } from 'react-redux'
import { useReduxReadModel } from '@resolve-js/redux'
import LoggedInContent from './LoggedInContent'

const LeagueSelect = ({ onLeagueSelected }) => {
  const [ refresh, setRefresh ] = useState(0)
  const { request: getLeagues, selector } = useReduxReadModel(
    {
      name: 'Leagues',
      resolver: 'all',
      args: {},
    },
    [],
    []
  )

  const { data: leagues } = useSelector(selector)

  useEffect(() => {
    getLeagues()
  }, [getLeagues, refresh])

  return leagues.length ? (<div>
    <h2>Leagues</h2>
    <div className="list-group">
    {leagues.map(({id, name, slug}) => (<Link to={`/leagues/${slug}`} className="list-group-item list-group-item-action h3" key={id}>{name}</Link>))}
    </div>
    <LoggedInContent showLoginLink={false}>
      <div>
        <Link className='btn btn-primary' to="/leagues/create">Create your own league</Link>
      </div>
    </LoggedInContent>
  </div>
  ) : (
    <div>
      <LoggedInContent message="Log in to create a league">
        <LeagueCreate onCreateSuccess={() => setRefresh(refresh + 1)}></LeagueCreate>
      </LoggedInContent>
    </div>  
  )
}

export { LeagueSelect }