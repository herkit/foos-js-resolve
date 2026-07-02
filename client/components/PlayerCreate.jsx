import React from 'react'
import useInput from "../hooks/useInput";
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'
import { Button } from 'react-bootstrap'

const PlayerCreate = ({ onCreateSuccess }) => {
  const [name, nameInput] = useInput({ type: "text", className: "form-control" })
  const [email, emailInput] = useInput({ type: "email", className: "form-control" })
  const [avatar, avatarInput] = useInput({ type: "text", className: "form-control" })  
  const [password, passwordInput] = useInput({ type: "password", className: "form-control" })  

  const createPlayer = useCommand(
    {
      type: 'createPlayer',
      aggregateId: uuid(),
      aggregateName: 'Player',
      payload: { name, email, avatar, password },
    },
    (err, result) => {
      console.log(err, result)
      if (result && result.aggregateId)
        onCreateSuccess({ playerId: result.aggregateId, payload: result.payload })
    }
  )

  return (<div>
    <div className="form-group">
      <label>Name</label>
      {nameInput}
    </div>
    <div className="form-group">
      <label>Email</label>
      {emailInput}
    </div>
    <div className="form-group">
      <label>Password</label>
      {passwordInput}
    </div>
    <div className="form-group">
      <label>Avatar</label>
      {avatarInput}
    </div>
    <div className="form-footer">
    <Button variant="success" onClick={() => createPlayer()}>
      Create Player
    </Button>
    </div>
  </div>)
}

export default PlayerCreate