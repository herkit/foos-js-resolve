import React from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

const PlayerDeleter = ({ playerId, onRemoveSuccess }) => {
  const deletePlayerCommand = useCommand(
    {
      type: 'deletePlayer',
      aggregateId: playerId,
      aggregateName: 'Player',
    },
    onRemoveSuccess
  )

  return <Button onClick={deletePlayerCommand}>Delete</Button>
}

export default PlayerDeleter