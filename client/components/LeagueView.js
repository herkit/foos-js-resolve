import React, { useState, useEffect } from 'react'
import { useCommand, useViewModel } from '@resolve-js/react-hooks'
import { SeasonView } from './SeasonView'
import { useSelector } from 'react-redux'
import { v4 as uuid } from 'uuid'
import LoggedInContent from './LoggedInContent';
import ConfirmButton from './ConfirmButton'

const StarSvg = ({filled, onClick, size}) => {
  const style = {
    fill: filled ? "#b58900" : "none",
    stroke: "#b58900",
    strokeWidth: "1px",
    strokeLinejoin: "round",
    paintOrder: "markers fill stroke",
    strokeMiterlimit: "4",
    strokeDasharray: "none"
  }
  return (
    <div onClick={onClick} title="Automatically browse to this league when logging in" style={{ cursor: "pointer" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size ?? "24"}
        height={size ?? "24"}
        viewBox="0 0 12.7 12.7"
        version="1.1"
        id="star">
        <g
          id="starpath">
          <path
            style={style}
            d="M 6.3500001,0.85989571 8.1190192,4.4443204 12.074667,5.0191098 9.2123333,7.8091951 9.8880384,11.748859 6.3499999,9.8888021 2.8119611,11.748859 3.4876665,7.8091951 0.62533314,5.0191094 4.5809806,4.4443204 Z"/>
        </g>
      </svg>
    </div>
  )
}

const LeagueView = ({id, slug}) => {
  if (!id) throw new Error("league id must be set")

  const [league, setLeague] = useState({ id: null, rating: "elo" })
  const [playerSettings, setPlayerSettings] = useState({ name: "", settings: {} })
  const me = useSelector((state) => state.jwt)

  const { connect: connectSettings, dispose: disposeSettings } = useViewModel(
    'PlayerSettings',
    [me.id],
    setPlayerSettings
  )

  const { connect, dispose } = useViewModel(
    'LeagueData',
    [id],
    setLeague
  )

  const setDefaultLeague = useCommand({
    type: 'setDefaultLeague',
    aggregateId: me.id,
    aggregateName: "Player",
    payload: { id, slug }

  }, (err, res) => {
    if (err)
      console.error(err)
    else
      console.log(res)
  })

  const createNewSeason =  useCommand({
    aggregateName: "Season",
    aggregateId: uuid(),
    type: "createSeason",
    payload: { leagueid: id, rating: league.rating }
  }, (err, res) => {
    if (err)
      console.error(err)
    else
      console.log(res)
  })
  
  const resetDefaultLeague = useCommand({
    type: 'resetDefaultLeague',
    aggregateId: me.id,
    aggregateName: "Player"
  }, (err, res) => {
    if (err)
      console.error(err)
    else
      console.log(res)
  })  

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  useEffect(() => {
    connectSettings()
    return () => {
      disposeSettings()
    }
  }, [me])

  useEffect(() => {
    console.log(playerSettings);
  }, [playerSettings])

  if (league?.currentSeason)
  {
    return (
      <div>
        <div className="bg-dark p-2 rounded mb-4 d-flex justify-content-between">
          <div>
            <small>Liga</small>
            <h2 className="display-5">{league.name}</h2>
          </div>
          {(() => { if (playerSettings.settings?.defaultLeague?.id === id) {
            return (<StarSvg filled={true} onClick={resetDefaultLeague}>Default</StarSvg>)
          } else {
            return (<StarSvg filled={false} onClick={setDefaultLeague}>Default</StarSvg>)
          }
          })()}
        </div>
        <SeasonView key={league.currentSeason} id={league.currentSeason}></SeasonView>
        <LoggedInContent showLoginLink={false} requireSuperuser={true}>
          <div className='mt-3 bg-dark p-2 rounded'>
            <h3 className='h6'>Control panel</h3>
            <ConfirmButton onConfirm={createNewSeason} text={"New season"} confirmText={"Sure?"} style={{ width: "14ch"}}></ConfirmButton>
          </div>
        </LoggedInContent>      
      </div>
    )
  }
  else
    return (
      <div>Loading</div>
    )
}

export { LeagueView }