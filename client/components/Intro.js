import { useViewModel } from '@resolve-js/react-hooks';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router'
import { Link } from 'react-router-dom';

const Intro = () => {
  const [league, setLeague] = useState();

  const me = useSelector((state) => state.jwt)

  const { connect: connectSettings, dispose: disposeSettings } = useViewModel(
    'PlayerSettings',
    [me.id],
    (player) => {
      console.log(player)
      if (player.settings?.defaultLeague)
        setLeague(player.settings.defaultLeague)
    }
  )

  useEffect(() => {
    connectSettings()
    return () => {
      disposeSettings()
    }
  }, [me])


  if (league)
    return (<Navigate to={`/leagues/${league.slug}`} />)
  else 
  return (
    <div className='container'>
      <div className='d-flex flex-column'>
        <div className='display-4 mb-4'>Manage your foosball league using foos.app!</div>
        <div className='lead'>Foos.app is a fully eventsourced foosball management application. We aim to give you a fast and convenient way to register your fooball matches.</div>
        <div className='mt-4'>
          <Link className='btn btn-primary btn-lg' to={"/leagues"}>Find a league to join</Link>
        </div>
      </div>
    </div>
  )
}

export { Intro }