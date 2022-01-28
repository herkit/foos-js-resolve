import React, { useState, useEffect } from 'react'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import PlayerDeleter from './PlayerDeleter'
import PlayerCreate from './PlayerCreate'
import { ThemeConsumer } from 'react-bootstrap/esm/ThemeProvider'
const PlayerList = () => {
  const [players, setPlayers] = useState([])
  const getPlayers = useQuery(
    { name: 'players', resolver: 'all', args: {} },
    (error, result) => {
      setPlayers(result.data.sort(i => i.name))
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])

  const onPlayerCreated = ({ playerId, payload: { name, email, avatar} }) => {
    console.log("playerCreated", playerId, name, email, avatar )
    setPlayers([
      ...players,
      {
        id: playerId,
        name: name,
        email: email,
        avatar: avatar,
      },
    ])
  }

  return (
    <div>
      <PlayerCreate onCreateSuccess={onPlayerCreated}></PlayerCreate>
      <table className='table table-condensed'>
        <thead>
          <tr><th>Name</th><th>Email</th></tr>
        </thead>
        <tbody>
        {players.map(({ id, name, email, avatar }) => (
          <tr key={id}>
            <td className="lead">{name}</td>
            <td>{email}</td>
            <td>
              <PlayerDeleter playerId={id} size="sm" onRemoveSuccess={(err, result) => {
                console.log("player deleted")
                setPlayers(
                  players.filter((player) => player.id !== result.aggregateId)
                )
              }} />
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  )
}

export { PlayerList }
