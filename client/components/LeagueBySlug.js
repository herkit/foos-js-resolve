import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { useParams } from 'react-router';
import { LeagueView } from './LeagueView';

const LeagueBySlug = () => {
  let params = useParams();
  const slug = params?.slug;
  if (!slug) throw new Error("slug must be set")

  const [leagueId, setLeagueId] = useState()

  const getBySlug = useQuery(
    { name: 'Leagues', resolver: 'getBySlug', args: { slug } },
    (error, result) => {
      setLeagueId(result.data.id)
    }
  )

  useEffect(() => {
    getBySlug()
  }, [])

  if (!leagueId) {
    return (<div>Not found</div>)    
  } else {
    return (<LeagueView id={leagueId}></LeagueView>)
  }
}

export { LeagueBySlug }