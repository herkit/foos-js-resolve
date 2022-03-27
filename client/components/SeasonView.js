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
import Moment from 'react-moment'

const byRankDesc = (a,b) => (b.rank - a.rank)
const byWinStreak = (a,b) => (b.longestWinStreak - a.longestWinStreak)
const byLossStreak = (a,b) => (b.longestLossStreak - a.longestLossStreak)

const NoRenderContainer = ({children}) => {
  return (children);
}

const millisecondsSinceMidnight = () => {
  const now = new Date();
  const then = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,0,0);
  return now.getTime() - then.getTime();
}

const classesByRank = (rank) => {
  if (rank == 0)
    return "h4 text-primary";
  if (rank < 3)
    return "h4 text-success";
  return "h4";
}

const RecordCard = ({record}) => (
  <div className="rounded bg-light bg-opacity-10 p-3">
    <div className="d-flex">
      <div className="w-75">
        <h3 className="card-title h6">{record.title}</h3>
        <div className="h4 text-truncate"><PlayerName playerid={record.id}></PlayerName></div>
      </div>
      <div className="display-5 w-25 text-end">{record.record}</div>
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

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (<div className='d-flex flex-lg-column flex-column-reverse my-2'>
    <div className='d-flex justify-content-between my-2'>
    {(() => { if (players?.records?.winStreak) { return <div className="w-50 pe-2" style={{maxWidth: "350px"}}><RecordCard record={players.records.winStreak} /></div> }})()}
    {(() => { if (players?.records?.lossStreak) { return <div className="w-50 ps-2" style={{maxWidth: "350px"}}><RecordCard record={players.records.lossStreak} /></div> }})()}
    </div>
    <div className='my-2'>
      <table className="table my-0">
        <thead>
          <tr className="h5">
            <th className='text-start'>Player</th>
            <th className='text-center d-none d-md-table-cell'>Played</th>
            <th className='text-center d-none d-sm-table-cell'><span className="d-none d-md-inline">Win/loss ratio</span><span className="d-inline d-md-none">W/L</span></th>
            <th className='text-end'>Rank</th>
          </tr>
        </thead>
        <tbody>
          {players?.ranks?.map((player, idx) => (
          <tr key={player.id} className={ classesByRank(idx) }>
            <td className='text-start'><PlayerName playerid={player.id}></PlayerName></td>
            <td className='text-center d-none d-md-table-cell'>{player.played}</td>
            <td className='text-center d-none d-sm-table-cell'>{player.lossCount > 0 ? (player.winCount / player.lossCount).toFixed(2) : "No loss"}</td>
            <td className='text-end'>{player.rank}</td>
          </tr>))}
        </tbody>
      </table>
    </div>

    <LoggedInContent>
      <button className="btn btn-primary my-2" onClick={() => setShowCreateMatch(true)}>New Match</button>
      <Modal fullscreen={"md-down"} show={showCreateMatch} onHide={() => setShowCreateMatch(false)}>
        <Modal.Header>
          <h2>New Match</h2>
        </Modal.Header>
        <Modal.Body>
          <MatchRegistration season={id} onCancel={() => setShowCreateMatch(false)} onCreated={() => setShowCreateMatch(false)}></MatchRegistration>
        </Modal.Body>
      </Modal>
    </LoggedInContent>

    <div className='d-none d-lg-inline my-2'>
      <div className="ticker-wrap bg-dark">
        <div className="ticker">
          {players?.recentMatches?.map((match, idx) => (
            <div className="ticker__item" key={match.timestamp}>
              <Moment date={new Date(match.timestamp)} className='text-light' fromNowDuring={millisecondsSinceMidnight()} format='ll[:]'></Moment>
              {match.winners.map((id, idx) => (
                <NoRenderContainer key={idx}>
                  {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                  <PlayerName playerid={id} className='ms-1' />
                </NoRenderContainer>))}<span className='ms-1'>won against</span>
              {match.losers.map((id, idx) => (
                <NoRenderContainer key={idx}>
                  {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                  <PlayerName playerid={id} className='ms-1' />
                </NoRenderContainer>))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>)
}

export { SeasonView }