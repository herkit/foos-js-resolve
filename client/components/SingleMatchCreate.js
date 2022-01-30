import React, { useState } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { v4 as uuid } from 'uuid'
import { useCommand } from '@resolve-js/react-hooks'
import { Button, Form } from "react-bootstrap";

const SingleMatchCreate = ({ season, onDone }) => {
  const [winner, setWinner] = useState()
  const [loser, setLoser] = useState()

  const registerMatch = useCommand(
    {
      type: 'registerSingleMatch',
      aggregateId: uuid(),
      aggregateName: 'Match',
      payload: { season, winner, loser },
    },
    (err, result) => {
      console.log(err, result)
      if (!err && onDone && typeof(onDone) === "function")
        onDone(result)
    }
  )

  const cancelMatch = () => {
    if (onDone && typeof(onDone) === "function")
      onDone()
  }

  return (<Form>
    <Form.Group controlId="formWinner">
      <Form.Label>Winner</Form.Label>
      <PlayerSelect onSelected={(p) => setWinner(p)}></PlayerSelect>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <Form.Label>Loser</Form.Label>
      <PlayerSelect onSelected={(p) => setLoser(p)}></PlayerSelect>
    </Form.Group>
    <Form.Group>
      <Button onClick={registerMatch}>Add</Button> 
      <Button onClick={cancelMatch}>Cancel</Button>
    </Form.Group>
  </Form>)
}

export { SingleMatchCreate }