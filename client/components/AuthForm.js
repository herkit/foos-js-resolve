import React from 'react'
import { Form } from 'react-bootstrap'

const AuthForm = ({ title, action, buttonText }) => (
  <Form action={action} method='POST'>
  <h1 className="h3 mb-3 font-weight-normal">{title}</h1>
    <Form.Group>
      <label htmlFor="inputEmail" className='visually-hidden'>Email address</label>
      <input id="inputEmail" type="email" name="username" className='form-control' placeholder='Email address' required autoFocus autoComplete='off' />
      <label htmlFor="inputPassword" className='visually-hidden'>Password</label>
      <input id="inputPassword" type="password" name="password" className='form-control' placeholder='Password' required autoComplete='off' />
    </Form.Group>
    <button type="submit" className='btn btn-lg btn-primary btn-block'>{buttonText}</button>
  </Form>
)
export { AuthForm }