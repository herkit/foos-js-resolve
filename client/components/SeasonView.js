import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { MatchRegistration } from "./MatchRegistration"
import { PlayerName } from './PlayerName'

const SeasonView = ({ id }) => {
  const [players, setPlayers] = useState()
  const getPlayers = useQuery(
    { 
      name: 'SeasonPlayers', 
      resolver: 'getById', 
      args: { id } 
    },
    (error, result) => {
      console.log(result)
      setPlayers(result.data)
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])

  return (<div>
    <div>
      <table>
        <thead>
          <tr><th>Player</th><th>Rank</th></tr>
        </thead>
        <tbody>
          {players?.map((player) => (<tr key={player.seasonid + player.playerid}><td><PlayerName playerid={player.playerid}></PlayerName></td><td>{player.rank}</td></tr>))}
        </tbody>
      </table>
    </div>
    <MatchRegistration season={id}>
    </MatchRegistration>
  </div>)
}

export { SeasonView }