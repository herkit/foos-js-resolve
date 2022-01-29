import React, { useState } from "react";
import { Button, Form, FormGroup } from "react-bootstrap";
import { DoubleMatchCreate } from "./DoubleMatchCreate";
import { SingleMatchCreate } from "./SingleMatchCreate";

const MatchRegistration = () => {
  const [registration, setRegistration] = useState()

  return (
    <div>
      {(() => {
        switch (registration) {
          case "single":
            return <SingleMatchCreate onDone={() => setRegistration()}></SingleMatchCreate>
          case "double":
            return <DoubleMatchCreate onDone={() => setRegistration()}></DoubleMatchCreate>
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