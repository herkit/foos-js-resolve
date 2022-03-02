import React, { useState, useEffect } from 'react'
import { useQuery, useClient } from '@resolve-js/react-hooks'
import Gravatar from 'react-gravatar';
import Switch from 'react-bootstrap/esm/Switch';

const PlayerAvatar = ({player, unselectedText}) => {
  if (player) {
    if (player.avatar)
      return (<img className="me-2 rounded-circle bg-light d-md" height={64} src={player.avatar}></img>)
    else
      return (<Gravatar className="me-2 rounded-circle bg-light d-md" email={player.email} size={64} default="robohash"></Gravatar>)
  } else {
    return (<svg className='rounded-circle border' xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice" width="64" height="64">
    <rect width="100%" height="100%" fill="#868e96"></rect>
    <text textAnchor="middle" x="50%" y="50%" fill="#dee2e6" dy=".5em">{unselectedText ?? "P"}</text>
  </svg>)
  }
}

const PlayerSelect = ({player, onSelected, unselectedText}) => {
  var selectPlayerTimeout
  const client = useClient()
  const [selected, setSelected] = useState(player)
  const [selectedPlayer, setSelectedPlayer] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [showSelect, setShowSelect] = useState(false)
  const [players, setPlayers] = useState([])

  const getPlayers = useQuery({ name: 'Players', resolver: 'all', args: {} }, (error, result) => {
    setPlayers(result.data)
  })

  useEffect(() => {
    getPlayers()
  }, [])

  useEffect(() => {
    const p = players.find((p) => p.id == selected)
    setSelectedPlayer(p)
  }, [players, selected])

  useEffect(() => {
    if (showSelect)
      selectPlayerTimeout = setTimeout(() => setShowSelect(false), 5000)

    return () => {
      if (selectPlayerTimeout)
        clearTimeout(selectPlayerTimeout)
    }
  }, [showSelect])

  useEffect(() => {

  }, [selectedPlayer])

  return (
    <div className='my-2'>
      <div onClick={() => setShowSelect(true)} className='d-flex d-flex-row align-items-center'>
        <PlayerAvatar player={selectedPlayer} unselectedText={unselectedText}></PlayerAvatar>
        <div className={`h3 ${ showSelect ? "d-none": ""}`}>{selectedPlayer?.name}</div>
      </div>
      <div className={`${ showSelect ? "d-block": "d-none"} bg-dark align-items-center`} style={{ "position": "absolute", "left": "0", "right": "0", "top": "0", "bottom": "0"}}
        onClick={() => setShowSelect(false)}
      >
        {players?.map((p, idx) => (
          <a className={`btn ${p.id == selected ? "btn-secondary" : "btn-outline-secondary"} rounded-pill m-1`} key={p.id} onClick={() => {
            setSelected(p.id)
            if (onSelected && typeof(onSelected) === "function")
              onSelected(p.id);
            setShowSelect(false)
          }}>{p.name}</a>
        ))}
      </div>
    </div>
  )
}

export { PlayerSelect }

