import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import PlayerDeleter from './PlayerDeleter'
import { ThemeConsumer } from 'react-bootstrap/esm/ThemeProvider'
const PlayerList = () => {
  const [players, setPlayers] = useState([])
  const [name, nameInput] = useInput({ type: "text", className: "form-control" })
  const [email, emailInput] = useInput({ type: "email", className: "form-control" })
  const [avatar, avatarInput] = useInput({ type: "text", className: "form-control" })
  const getPlayers = useQuery(
    { name: 'players', resolver: 'all', args: {} },
    (error, result) => {
      setPlayers(result.data.sort(i => i.name))
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])
  const createPlayer = useCommand(
    {
      type: 'createPlayer',
      aggregateId: uuid(),
      aggregateName: 'Player',
      payload: { name: name, email: email, avatar: avatar },
    },
    (error, result, { aggregateId, payload: { name, email, avatar } }) => {
      if (!error) 
        setPlayers([
          ...players,
          {
            id: aggregateId,
            name: name,
            email: email,
            avatar: avatar,
          },
        ].sort(i => i.name))
    }
  )
/*  const deleteAggregate = useCommand(
    (id) => ({
      type: 'delete',
      aggregateId: id,
      aggregateName: 'MyAggregate',
    }),
    (error, result, { aggregateId }) => {
      setAggregates([
        ...aggregates.filter((aggregate) => aggregate.id !== aggregateId),
      ])
    }
  )*/

  return (
    <div>
      {nameInput}
      {emailInput}
      {avatarInput}
      <Button variant="success" onClick={() => createPlayer()}>
        Create Player
      </Button>
      <div className="my-aggregates">
        {players.map(({ id, name, email, avatar }) => (
          <div key={id}>
            <p className="lead">{name}</p>
            <p>{email}</p>
            <PlayerDeleter playerId={id} onRemoveSuccess={(err, result) => {
              console.log("player deleted")
              setPlayers(
                players.filter((player) => player.id !== result.aggregateId)
              )
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function useInput({ type, className }) {
  const [value, setValue] = useState("");
  const input = <input value={value} onChange={e => setValue(e.target.value)} type={type} className={className} />;
  return [value, input];
}

export { PlayerList }
