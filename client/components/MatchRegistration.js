import React, { useState } from "react";
import { Button, Form, FormGroup } from "react-bootstrap";
import { DoubleMatchCreate } from "./DoubleMatchCreate";
import { SingleMatchCreate } from "./SingleMatchCreate";

const MatchRegistration = ({season}) => {
  const [registration, setRegistration] = useState()

  return (
    <div>
      {(() => {
        switch (registration) {
          case "single":
            return <SingleMatchCreate season={season} onDone={() => setRegistration()}></SingleMatchCreate>
          case "double":
            return <DoubleMatchCreate season={season} onDone={() => setRegistration()}></DoubleMatchCreate>
          default:
            return <FormGroup>
              <Button onClick={() => setRegistration("single")}>Single</Button>
              <Button onClick={() => setRegistration("double")}>Double</Button>
            </FormGroup>
        }
      })()}
    </div>)
}

export { MatchRegistration }