import { useViewModel } from '@resolve-js/react-hooks'
import React, { useState, useEffect } from 'react'

const PlayerName = ({playerid}) => {
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
  }, [playerid])

  if (player.deleted)
    return (<span style={{opacity: "0.5"}}>{player.name}</span>)
  else
    return (<span>{player.name}</span>)
}

export { PlayerName }