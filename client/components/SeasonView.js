import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { MatchRegistration } from "./MatchRegistration"

const SeasonView = ({id}) => {
  const [players, setPlayers] = useState()
  const getPlayers = useQuery(
    { name: 'SeasonPlayers', resolver: 'getById', args: { seasonid: id } },
    (error, result) => {
      console.log(result)
      setPlayers(result.data)
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])

  return (<div>
    <div>{id}</div>
    {players.map((player) => (<tr><td>{player.playerid}</td><td>{player.rank}</td></tr>))}
    <MatchRegistration season={id}>
    </MatchRegistration>
  </div>)
}

export { SeasonView }