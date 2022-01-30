import React, { useState, useEffect } from 'react'
import { useQuery, useClient } from '@resolve-js/react-hooks'
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

const PlayerSelect = ({player, onSelected}) => {
  const client = useClient()
  const [selected, setSelected] = useState(player)
  const [isLoading, setIsLoading] = useState(false)
  const [players, setPlayers] = useState([])

  const onSearch = term => {
    setIsLoading(true)
    client.query(
      {
        name: 'Players',
        resolver: 'autocomplete',
        args: {
          term
        }
      },
      (err, result) => {
        setIsLoading(false)
        setPlayers(result.data)
      }
    )
  }

  return (
    <AsyncTypeahead
      id="playerSelect"
      isLoading={isLoading}
      labelKey="name"
      onSearch={onSearch}
      onChange={(item) => 
        {
          var value;
          if (item.length > 0) 
            value = item[0].id; 
          else 
            value = null; 
          setSelected(value);
          if (onSelected && typeof(onSelected) === "function")
            onSelected(value);
        }
      }
      options={players}
    />
  )
}

export { PlayerSelect }

