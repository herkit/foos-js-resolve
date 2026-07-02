import React, { useEffect, useState } from 'react'
import { useCommand } from '@resolve-js/react-hooks'
import ConfirmButton from './ConfirmButton'

const PlayerDeleter = ({ playerId, onRemoveSuccess, size }) => {
  const buttonStyle = { width: "10ch" }

  const deletePlayerCommand = useCommand(
    {
      type: 'deletePlayer',
      aggregateId: playerId,
      aggregateName: 'Player',
    },
    onRemoveSuccess
  )

  return <ConfirmButton onConfirm={deletePlayerCommand} text={"Delete"} confirmText={"Sure?"} size={size} style={buttonStyle}></ConfirmButton>
}

export default PlayerDeleter