import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

const PlayerDeleter = ({ playerId, onRemoveSuccess, size }) => {
  var confirmTimeout;
  const buttonStyle = {
    width: "10ch"
  }
  const [confirm, setConfirm] = useState(false);
  const deletePlayerCommand = useCommand(
    {
      type: 'deletePlayer',
      aggregateId: playerId,
      aggregateName: 'Player',
    },
    onRemoveSuccess
  )

  useEffect(() => {
    if (confirm)
      confirmTimeout = setTimeout(() => setConfirm(false), 2500)

    return () => {
      if (confirmTimeout)
        clearTimeout(confirmTimeout)
    }
  }, [confirm]);

  const confirmDelete = () => {
    setConfirm(true)
  }

  return confirm ? <Button onClick={deletePlayerCommand} className="btn-danger" style={buttonStyle} size={size}>Sure?</Button> : <Button onClick={confirmDelete} style={buttonStyle} size={size}>Delete</Button>
}

export default PlayerDeleter