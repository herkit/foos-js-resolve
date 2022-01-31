import React, { useState, useEffect } from 'react'
import { useQuery, useViewModel } from '@resolve-js/react-hooks'
import { MatchRegistration } from "./MatchRegistration"
import { PlayerName } from './PlayerName'

const byRankDesc = (a,b) => (b.rank - a.rank)
const byWinStreak = (a,b) => (b.longestWinStreak - a.longestWinStreak)
const byLossStreak = (a,b) => (b.longestLossStreak - a.longestLossStreak)

const RecordCard = ({record}) => (
  <div className="card col-4">
    <div className="card-body">
      <h3 className='card-title h6'>{record.title}</h3>
      <div className='row'>
        <div className='display-4 col-9'><PlayerName playerid={record.id}></PlayerName></div>
        <div className='display-4 col-3'>{record.record}</div>
      </div>
    </div>
  </div>
)

const SeasonView = ({ id }) => {
  const [players, setPlayers] = useState()
  const [winStreak, setWinStreak] = useState({ id: 0, winStreak: 0 })
  const [lossStreak, setLossStreak] = useState({ id: 0, lossStreak: 0 })

  const setPlayers1 = (data) => {   
    var ranks = Object.keys(data.players).reduce((prev, current) => ([...prev, data.players[current]]), [])
    var longestWinStreak = ranks.sort(byWinStreak)[0];
    var longestLossStreak = ranks.sort(byLossStreak)[0];
    console.log(longestLossStreak, longestWinStreak)
    if (longestWinStreak)
      setWinStreak({ title: "Longest win streak", id: longestWinStreak.id, record: longestWinStreak.longestWinStreak })
    if (longestLossStreak)
      setLossStreak({ title: "Longest loss streak", id: longestLossStreak.id, record: longestLossStreak.longestLossStreak })
    setPlayers(ranks.sort(byRankDesc))
  }

  const {connect, dispose} = useViewModel("SeasonRanks", [id], setPlayers1);

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (<div>
    <div className='row'>
    {(() => { if (winStreak) { return <RecordCard record={winStreak} />}})()}
    {(() => { if (lossStreak) { return <RecordCard record={lossStreak} />}})()}
    </div>
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Played</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {players?.map((player) => (
          <tr key={player.id}>
            <td><PlayerName playerid={player.id}></PlayerName></td>
            <td>{player.played}</td>
            <td>{player.rank}</td>
          </tr>))}
        </tbody>
      </table>
    </div>
    <MatchRegistration season={id}>
    </MatchRegistration>
  </div>)
}

export { SeasonView }