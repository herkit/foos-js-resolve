import React, { useState } from 'react'
import useInput from "../hooks/useInput";
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'
import { Button } from 'react-bootstrap'

const LeagueCreate = ({ onCreateSuccess }) => {
  const [name, nameInput] = useInput({ type: "text", className: "form-control" })
  const [rating, setRating] = useState("elo")

  const createLeague = useCommand(
    {
      type: 'createLeague',
      aggregateId: uuid(),
      aggregateName: 'League',
      payload: { name, rating },
    },
    (err, result) => {
      if (result && result.aggregateId)
        onCreateSuccess(result.aggregateId, result.payload)
    }
  )

  return (<div>
    <h2>New league</h2>
    <div className="form-group">
      <label>Name</label>
      {nameInput}
    </div>
    <div className="form-group">
      <label>Rating system</label>
      <select className="form-control" onChange={(e) => setRating(e.target.value)}>
        <option value="elo" selected>Elo rating</option>
        <option value="basic">Basic rating</option>
      </select>
    </div>
    <div className="form-footer">
    <Button variant="success" onClick={() => createLeague()}>
      Create League
    </Button>
    </div>
  </div>)
}

export { LeagueCreate }