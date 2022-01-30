import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { SeasonView } from './SeasonView'
import { useParams } from 'react-router';

const LeagueView = () => {
  let params = useParams();
  const id = params?.id;
  if (!id) throw new Error("league id must be set")

  const [name, setName] = useState()
  const [season, setSeason] = useState()
  const getLeague = useQuery(
    { name: 'Leagues', resolver: 'getById', args: { id } },
    (error, result) => {
      setName(result.data.name)
      setSeason(result.data.currentSeason)
    }
  )
  useEffect(() => {
    getLeague()
  }, [])

  return (
    <div>
      <h2>{name}</h2>
      <SeasonView id={season}></SeasonView>
    </div>
  )
}

export { LeagueView }