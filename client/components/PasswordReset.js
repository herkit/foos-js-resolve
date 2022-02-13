import { useCommand } from '@resolve-js/react-hooks';
import React, { useState } from 'react'
import { Form } from 'react-bootstrap'
import { useParams } from 'react-router';

const PasswordReset = () => {
  const params = useParams();
  const handle = params?.handle;
  const [password, setPasswordState] = useState();
  const [confirm, setConfirmState] = useState();
  
  const setPassword = (value) => 
  {
    setPasswordState(value);
  }

  const setPasswordConfirmed = (value) => 
  {
    setConfirmState(value)
  }

  const changePassword = () => {

  }

  return (
    <div>
      <h1 className="h3 mb-3 font-weight-normal">Reset password</h1>
      <Form.Group>
        <label htmlFor="inputPassword" className='visually-hidden'>Password</label>
        <input id="inputPassword" type="password" name="password" className='form-control' placeholder='Password' required autoComplete='off' onChange={(e) => setPassword(e.target.value)} />
        <label htmlFor="inputConfirmPassword" className='visually-hidden'>Confirm password</label>
        <input id="inputConfirmPassword" type="password" name="confirmPassword" className='form-control' placeholder='Password' required autoComplete='off' onChange={(e) => setPasswordConfirmed(e.target.value)} />
      </Form.Group>
      <button type="submit" disabled={confirm != password} className='btn btn-lg btn-primary btn-block' onClick={changePassword}>Reset Password</button>
    </div>
)}
export { PasswordReset }