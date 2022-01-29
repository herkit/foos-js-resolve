import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'

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

  const selectLeague = (id) => {
    if (onLeagueSelected && typeof(onLeagueSelected) === "function")
      onLeagueSelected(id)
  }

  return (<div>
    <h2>Leagues</h2>
    <div className="list-group">
    {leagues.map(({id, name}) => (<a className="list-group-item list-group-item-action" key={name} onClick={() => selectLeague(id)}>{name}</a>))}
    </div>
  </div>
  
  )
}

export { LeagueSelect }