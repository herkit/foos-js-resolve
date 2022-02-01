import React from 'react'
import { Form } from 'react-bootstrap'

const AuthForm = ({ title, action, buttonText }) => (
  <div>
    <h3>{title}</h3>
    <Form action={action} method='POST'>
      <Form.Group>
        <div>Email:</div>
        <input type="text" name="username" />

        <div>Password:</div>
        <input type="text" name="password" />
      </Form.Group>
      <input type="submit" value={buttonText} />
    </Form>
  </div>
)
export { AuthForm }