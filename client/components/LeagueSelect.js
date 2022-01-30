import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { Link } from 'react-router-dom'

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
    {leagues.map(({id, name}) => (<Link to={`/leagues/${id}`} className="list-group-item list-group-item-action" key={name}>{name}</Link>))}
    </div>
  </div>
  
  )
}

export { LeagueSelect }