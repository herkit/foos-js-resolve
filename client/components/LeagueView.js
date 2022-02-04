import React, { useState, useEffect } from 'react'
import { useViewModel } from '@resolve-js/react-hooks'
import { SeasonView } from './SeasonView'
import { useParams } from 'react-router';

const LeagueView = ({id}) => {
  if (!id) throw new Error("league id must be set")

  const [league, setLeague] = useState()

  const { connect, dispose } = useViewModel(
    'LeagueData', // The View Model's name.
    [id], // The aggregate ID for which to query data.
    setLeague // A callback to call when new data is recieved.
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  if (league?.currentSeason)
  {
    return (
      <div>
        <h2>{league.name}</h2>
        <SeasonView key={league.currentSeason} id={league.currentSeason}></SeasonView>
      </div>
    )
  }
  else
    return (
      <div>Loading</div>
    )
}

export { LeagueView }