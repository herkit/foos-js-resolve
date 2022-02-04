import React, { useState } from "react";
import { Button, Form, FormGroup } from "react-bootstrap";
import { DoubleMatchCreate } from "./DoubleMatchCreate";
import { SingleMatchCreate } from "./SingleMatchCreate";

const MatchRegistration = ({season, onCancel, onCreated}) => {
  const [registration, setRegistration] = useState()

  const onDone = function () {
    setRegistration()
    if (onCreated && typeof(onCreated) === "function")
      onCreated();
  }

  return (
    <div>
      {(() => {
        switch (registration) {
          case "single":
            return <SingleMatchCreate season={season} onDone={onDone} onCancel={onCancel}></SingleMatchCreate>
          case "double":
            return <DoubleMatchCreate season={season} onDone={onDone} onCancel={onCancel}></DoubleMatchCreate>
          default:
            return <FormGroup>
              <Button onClick={() => setRegistration("single")}>Single</Button>
              <Button onClick={() => setRegistration("double")}>Double</Button>
              <Button onClick={onCancel}>Cancel</Button>
            </FormGroup>
        }
      })()}
    </div>)
}

export { MatchRegistration }