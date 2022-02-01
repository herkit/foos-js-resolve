import React from 'react'
import { useLocation } from 'react-router-dom'
import { AuthForm } from './AuthForm'
const Login = (props) => {
  const location = useLocation()
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`/api/login${location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action="/api/register"
        title="Create account"
      />
    </div>
  )
}
export { Login }