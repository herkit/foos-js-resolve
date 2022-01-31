import { useViewModel } from '@resolve-js/react-hooks'
import React, { useState, useEffect } from 'react'

const PlayerName = ({playerid}) => {
  const [playerName, setPlayerName] = useState("Unknown player")

  const { connect, dispose } = useViewModel(
    'PlayerName', // The View Model's name.
    [playerid], // The aggregate ID for which to query data.
    setPlayerName // A callback to call when new data is recieved.
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <span>
    {playerName}
    </span>
  )
}

export { PlayerName }