import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LeagueCreate } from './LeagueCreate'
import { useSelector } from 'react-redux'
import { useReduxReadModel } from '@resolve-js/redux'

const LeagueSelect = ({ onLeagueSelected }) => {
  const { request: getLeagues, selector } = useReduxReadModel(
    {
      name: 'Leagues',
      resolver: 'all',
      args: {},
    },
    [],
    []
  )

  const { data: leagues } = useSelector(selector)

  useEffect(() => {
    getLeagues()
  }, [getLeagues])

  return leagues.length ? (<div>
    <h2>Leagues</h2>
    <div className="list-group">
    {leagues.map(({id, name, slug}) => (<Link to={`/leagues/${slug}`} className="list-group-item list-group-item-action" key={id}>{name}</Link>))}
    </div>
    <LeagueCreate></LeagueCreate>
  </div>
  ) : (
    <div><LeagueCreate></LeagueCreate></div>  
  )
}

export { LeagueSelect }