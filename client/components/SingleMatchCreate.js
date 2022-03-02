import React, { useState } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { v4 as uuid } from 'uuid'
import { useCommand } from '@resolve-js/react-hooks'
import { Button, Form } from "react-bootstrap";

const SingleMatchCreate = ({ season, onDone, onCancel }) => {
  const [winner, setWinner] = useState()
  const [loser, setLoser] = useState()

  const registerMatch = useCommand(
    {
      type: 'registerMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: uuid(), winners: [winner], losers: [loser] },
    },
    (err, result) => {
      console.log(err, result)
      if (!err && onDone && typeof(onDone) === "function")
        onDone(result)
    }
  )

  const cancelMatch = () => {
    if (onCancel && typeof(onCancel) === "function") 
      onCancel()
    else if (onDone && typeof(onDone) === "function")
      onDone()
  }

  return (<Form>
    <h3>Single</h3>
    <Form.Group controlId="formWinner">
      <Form.Label>Winner</Form.Label>
      <PlayerSelect onSelected={(p) => setWinner(p)} unselectedText="W"></PlayerSelect>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <Form.Label>Loser</Form.Label>
      <PlayerSelect onSelected={(p) => setLoser(p)} unselectedText="L"></PlayerSelect>
    </Form.Group>
    <Form.Group className="mt-4">
      <Button onClick={registerMatch} className="me-2" variant="primary" style={{"width": "10ch"}}>Add</Button> 
      <Button onClick={cancelMatch} variant="outline-primary" style={{"width": "10ch"}}>Cancel</Button>
    </Form.Group>
  </Form>)
}

export { SingleMatchCreate }