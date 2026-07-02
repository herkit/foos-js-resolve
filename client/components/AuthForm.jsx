import React, { useState } from 'react'
import { Form } from 'react-bootstrap'
import { apiPost } from '../api/client'

// Was a native form POST to reSolve's /api/(login|register) with a redirect.
// Now posts JSON to the NestJS auth endpoints and navigates on success (a full
// navigation so the app re-reads the freshly-set `jwt` cookie).
const AuthForm = ({ title, buttonText, endpoint = 'login' }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await apiPost(`/auth/${endpoint}`, { username, password })
      const params = new URLSearchParams(window.location.search)
      window.location.assign(params.get('redirect') || '/leagues')
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <Form onSubmit={submit}>
      <h1 className="h3 mb-3 font-weight-normal">{title}</h1>
      <Form.Group>
        <label htmlFor="inputEmail" className="visually-hidden">Email address</label>
        <input
          id="inputEmail"
          type="email"
          name="username"
          className="form-control"
          placeholder="Email address"
          required
          autoFocus
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="inputPassword" className="visually-hidden">Password</label>
        <input
          id="inputPassword"
          type="password"
          name="password"
          className="form-control"
          placeholder="Password"
          required
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Group>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      <button type="submit" className="btn btn-lg btn-primary btn-block mt-2">
        {buttonText}
      </button>
    </Form>
  )
}
export { AuthForm }
