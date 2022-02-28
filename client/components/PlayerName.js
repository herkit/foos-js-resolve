import { useViewModel } from '@resolve-js/react-hooks'
import React, { useState, useEffect } from 'react'

const PlayerName = ({playerid, className}) => {
  const [player, setPlayer] = useState("Unknown player")
  const { connect, dispose } = useViewModel(
    'PlayerName', // The View Model's name.
    [playerid], // The aggregate ID for which to query data.
    setPlayer // A callback to call when new data is recieved.
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  if (player.deleted)
    return (<span style={{opacity: "0.5"}} className={className}>{player.name}</span>)
  else
    return (<span className={className}>{player.name}</span>)
}

export { PlayerName }