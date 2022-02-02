import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthForm } from './AuthForm'

const Switch = props => {
  const { test, children } = props
  // filter out only children with a matching prop
  return children.find(child => {
    return child.props.case === test
  })      
}

const Login = (props) => {
  const location = useLocation()
  const [view, setView] = useState("login")
  return (
    <div className='form-signin'>
      <Switch test={view}>
        <div case="login">
          <AuthForm
            buttonText="Login"
            action={`/api/login${location.search}`}
            title="Please sign in"
          />
          <div className='mt-3'>
            No account yet? <a href="#" onClick={() => setView("signup")}>Signup here...</a>
          </div>
        </div>
        <div case="signup">
          <AuthForm
            buttonText="Create account"
            action={`/api/register${location.search}`}
            title="Create account"
          />
          <div className='mt-3'>
            <a href="#" onClick={() => setView("login")}>Log in</a>
          </div>
        </div>
      </Switch>
    </div>
  )
}
export { Login }