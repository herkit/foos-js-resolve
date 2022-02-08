import React, { useState, useEffect } from 'react'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import PlayerDeleter from './PlayerDeleter'
import PlayerCreate from './PlayerCreate'
import { Outlet } from 'react-router'
import LoggedInContent from './LoggedInContent'
import { Modal } from 'react-bootstrap'
const PlayerList = () => {
  const [players, setPlayers] = useState([])
  const [showPlayerCreate, setShowPlayerCreate] = useState(false)
  const getPlayers = useQuery(
    { name: 'Players', resolver: 'all', args: {} },
    (error, result) => {
      setPlayers(result.data.sort(i => i.name))
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])

  const onPlayerCreated = ({ playerId, payload: { name, email, avatar} }) => {
    setShowPlayerCreate(false)
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
  /**/
  return (
    <div>
      <table className='table table-condensed'>
        <thead>
          <tr><th>Name</th><th>Email</th><th></th></tr>
        </thead>
        <tbody>
        {players.map(({ id, name, email, avatar }) => (
          <tr key={id}>
            <td className="lead">{name}</td>
            <td>{email}</td>
            <td>
              <LoggedInContent requireSuperuser={true} showLoginLink={false}>
                <PlayerDeleter playerId={id} size="sm" onRemoveSuccess={(err, result) => {
                  console.log("player deleted")
                  setPlayers(
                    players.filter((player) => player.id !== result.aggregateId)
                  )
                }} />
              </LoggedInContent>
            </td>
          </tr>
        ))}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">
              <a class="btn btn-primary" onClick={() => setShowPlayerCreate(true)}>Create User</a>
            </td>
          </tr>
        </tfoot>
      </table>
      <Modal backdrop="static" show={showPlayerCreate} onHide={() => setShowPlayerCreate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Player</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <PlayerCreate onCreateSuccess={onPlayerCreated}></PlayerCreate>
        </Modal.Body>
      </Modal>      
      <Outlet></Outlet>
    </div>
  )
}

export { PlayerList }
