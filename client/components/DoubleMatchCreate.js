import React, { useState } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { v4 as uuid } from 'uuid'
import { useCommand } from '@resolve-js/react-hooks'
import { Button, Form } from "react-bootstrap";

const DoubleMatchCreate = ({ season, onDone, onCancel }) => {
  const [winner1, setWinner1] = useState()
  const [winner2, setWinner2] = useState()
  const [loser1, setLoser1] = useState()
  const [loser2, setLoser2] = useState()

  const registerMatch = useCommand(
    {
      type: 'registerMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: uuid(), winners: [winner1, winner2], losers: [loser1, loser2] },
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
    <h3>Double</h3>
    <Form.Group controlId="formWinner">
      <Form.Label>Winners</Form.Label>
      <PlayerSelect onSelected={(p) => setWinner1(p)} unselectedText="W1"></PlayerSelect>
      <PlayerSelect onSelected={(p) => setWinner2(p)} unselectedText="W2"></PlayerSelect>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <Form.Label>Losers</Form.Label>
      <PlayerSelect onSelected={(p) => setLoser1(p)} unselectedText="L1"></PlayerSelect>
      <PlayerSelect onSelected={(p) => setLoser2(p)} unselectedText="L2"></PlayerSelect>
    </Form.Group>
    <Form.Group className="mt-4">
      <Button onClick={registerMatch} className="me-2" variant="primary" style={{"width": "10ch"}}>Add</Button> 
      <Button onClick={cancelMatch} variant="outline-primary" style={{"width": "10ch"}}>Cancel</Button>
    </Form.Group>
  </Form>)
}

export { DoubleMatchCreate }