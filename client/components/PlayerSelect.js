import React, { useState, useEffect } from 'react'
import { useQuery, useClient } from '@resolve-js/react-hooks'
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { getClient } from '@resolve-js/client'

const PlayerSelect = ({player}) => {
  const client = useClient()
  const [selected, setSelected] = useState(player)
  const [isLoading, setIsLoading] = useState(false)
  const [players, setPlayers] = useState([])

  const onSearch = term => {
    setIsLoading(true)
    client.query(
      {
        name: 'players',
        resolver: 'autocomplete',
        args: {
          term
        }
      },
      (err, result) => {
        setIsLoading(false)
        setPlayers(result)
      }
    )
  }

  return (
    <AsyncTypeahead
      isLoading={isLoading}
      labelKey="name"
      onSearch={onSearch}
      onChange={(item) => setSelected(item.id)}
      options={players}
    />
  )
}

export { PlayerSelect }

