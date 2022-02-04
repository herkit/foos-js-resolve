import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { Link } from 'react-router-dom'
import { LeagueCreate } from './LeagueCreate'

const LeagueSelect = ({ onLeagueSelected }) => {
  const [leagues, setLeagues] = useState([])
  const getLeagues = useQuery(
    { name: 'Leagues', resolver: 'all', args: {} },
    (error, result) => {
      setLeagues(result.data)
    }
  )
  useEffect(() => {
    getLeagues()
  }, [])

  return (<div>
    <h2>Leagues</h2>
    <div className="list-group">
    {leagues.map(({id, name, slug}) => (<Link to={`/leagues/${slug}`} className="list-group-item list-group-item-action" key={id}>{name}</Link>))}
    </div>
    <LeagueCreate></LeagueCreate>
  </div>
  
  )
}

export { LeagueSelect }