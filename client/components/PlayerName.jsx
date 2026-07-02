import { useViewModel } from '@resolve-js/react-hooks'
import { useReduxReadModelSelector } from '@resolve-js/redux'
import React, { useState, useEffect } from 'react'

const PlayerName = ({playerid, className}) => {
  const [player, setPlayer] = useState({ deleted: true })
  const { status: playerStatus, data: players } = useReduxReadModelSelector("all-players")

  useEffect(() => {
    if (playerStatus == "ready")
    {
      const cur = players.find(p => p.id == playerid);
      if (cur)
        setPlayer(cur)
    }
  }, [playerStatus, playerid])

  if (player.deleted)
    return (<span style={{opacity: "0.5"}} className={className}>{player.name}</span>)
  else
    return (<span className={className}>{player.name}</span>)
}

export { PlayerName }