import React, { useState, useEffect } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { Form } from "react-bootstrap";

const SingleMatchCreate = () => {
  const [winner, setWinner] = useState()
  const [loser, setLoser] = useState()

  const getPlayers = useQuery(
    { name: 'players', resolver: 'all', args: {} },
    (error, result) => {
      setPlayers(result.data.sort(i => i.name))
    }
  )
  useEffect(() => {
    getPlayers()
  }, [])

  return (<div><Form>
    <Form.Group controlId="formWinner">
      <Form.Label>Winner</Form.Label>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <Form.Label>Loser</Form.Label>
    </Form.Group>
  </Form></div>)
}

export { SingleMatchCreate }