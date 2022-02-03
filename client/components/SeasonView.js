import React, { useState, useEffect } from 'react'
//import { useQuery, useViewModel } from '@resolve-js/react-hooks'
import { MatchRegistration } from "./MatchRegistration"
import { PlayerName } from './PlayerName'
import { useSelector } from 'react-redux'
import { useReduxViewModel } from '@resolve-js/redux'
import { Helmet } from 'react-helmet'

const byRankDesc = (a,b) => (b.rank - a.rank)
const byWinStreak = (a,b) => (b.longestWinStreak - a.longestWinStreak)
const byLossStreak = (a,b) => (b.longestLossStreak - a.longestLossStreak)

const RecordCard = ({record}) => (
  <div className="card col-4">
    <div className="card-body">
      <h3 className='card-title h6'>{record.title}</h3>
      <div className='row'>
        <div className='display-4 col-9'><PlayerName playerid={record.id}></PlayerName></div>
        <div className='display-4 col-3 text-right'>{record.record}</div>
      </div>
    </div>
  </div>
)

const SeasonView = ({ id }) => {
  const [winStreak, setWinStreak] = useState()
  const [lossStreak, setLossStreak] = useState()

  /*const setPlayers1 = (data) => {   
    var ranks = Object.keys(data.players).reduce((prev, current) => ([...prev, data.players[current]]), [])
    var longestWinStreak = ranks.sort(byWinStreak)[0];
    var longestLossStreak = ranks.sort(byLossStreak)[0];
    console.log(longestLossStreak, longestWinStreak)
    if (longestWinStreak)
      setWinStreak({ title: "Longest win streak", id: longestWinStreak.id, record: longestWinStreak.longestWinStreak })
    if (longestLossStreak)
      setLossStreak({ title: "Longest loss streak", id: longestLossStreak.id, record: longestLossStreak.longestLossStreak })
    setPlayers(ranks.sort(byRankDesc))
  }*/

  const {connect, dispose, selector: playersSelector} = useReduxViewModel({
    name: "SeasonRanks", 
    aggregateIds: [id],
  })
  const { data: players, playersStatus } = useSelector(playersSelector)

  console.log(players)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (<div>
    <div className='d-flex justify-content-between'>
    {(() => { if (players?.records?.winStreak) { return <RecordCard record={players.records.winStreak} />}})()}
    {(() => { if (players?.records?.lossStreak) { return <RecordCard record={players.records.lossStreak} />}})()}
    </div>
    <div>
      <table className="table scoreboard">
        <thead>
          <tr>
            <th>Player</th>
            <th className='text-center'>Played</th>
            <th className='text-right'>Rank</th>
          </tr>
        </thead>
        <tbody>
          {players?.ranks?.map((player) => (
          <tr key={player.id}>
            <td><PlayerName playerid={player.id}></PlayerName></td>
            <td className='text-center'>{player.played}</td>
            <td className='text-right'>{player.rank}</td>
          </tr>))}
        </tbody>
      </table>
    </div>
    <MatchRegistration season={id}>
    </MatchRegistration>
  </div>)
}

export { SeasonView }