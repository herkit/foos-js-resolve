import React, { useState, useEffect } from 'react'
//import { useQuery, useViewModel } from '@resolve-js/react-hooks'
import { MatchRegistration } from "./MatchRegistration"
import { PlayerName } from './PlayerName'
import { useSelector } from 'react-redux'
import { useReduxViewModel } from '@resolve-js/redux'
import { Helmet } from 'react-helmet'
import { Modal } from 'react-bootstrap'
import { Navigate } from 'react-router'
import LoggedInContent from './LoggedInContent'

const byRankDesc = (a,b) => (b.rank - a.rank)
const byWinStreak = (a,b) => (b.longestWinStreak - a.longestWinStreak)
const byLossStreak = (a,b) => (b.longestLossStreak - a.longestLossStreak)

const RecordCard = ({record}) => (
  <div className="card col-5 col-lg-4">
    <div className="card-body">
      <h3 className='card-title h6'>{record.title}</h3>
      <div className='row'>
        <div className='display-5 col-9'><PlayerName playerid={record.id}></PlayerName></div>
        <div className='display-5 col-3 text-end'>{record.record}</div>
      </div>
    </div>
  </div>
)

const SeasonView = ({ id }) => {
  const [showCreateMatch, setShowCreateMatch] = useState(false)

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
    <div className='d-flex justify-content-between mb-4'>
    {(() => { if (players?.records?.winStreak) { return <RecordCard record={players.records.winStreak} />}})()}
    {(() => { if (players?.records?.lossStreak) { return <RecordCard record={players.records.lossStreak} />}})()}
    </div>
    <div>
      <table className="table scoreboard">
        <thead>
          <tr>
            <th className='text-start'>Player</th>
            <th className='text-center'>Played</th>
            <th className='text-center'>Win/loss ratio</th>
            <th className='text-end'>Rank</th>
          </tr>
        </thead>
        <tbody>
          {players?.ranks?.map((player) => (
          <tr key={player.id}>
            <td className='text-start'><PlayerName playerid={player.id}></PlayerName></td>
            <td className='text-center'>{player.played}</td>
            <td className='text-center'>{player.lossCount > 0 ? (player.winCount / player.lossCount).toFixed(2) : "No loss"}</td>
            <td className='text-end'>{player.rank}</td>
          </tr>))}
        </tbody>
      </table>
    </div>

    <LoggedInContent>
      <button className="btn btn-primary" onClick={() => setShowCreateMatch(true)}>New Match</button>
      <Modal show={showCreateMatch} onHide={() => setShowCreateMatch(false)}>
        <Modal.Header>
          <h2>New Match</h2>
        </Modal.Header>
        <Modal.Body>
          <MatchRegistration season={id} onCancel={() => setShowCreateMatch(false)} onCreated={() => setShowCreateMatch(false)}></MatchRegistration>
        </Modal.Body>
      </Modal>
    </LoggedInContent>
  </div>)
}

export { SeasonView }