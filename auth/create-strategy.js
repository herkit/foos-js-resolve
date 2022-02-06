import { Strategy as StrategyFactory } from 'passport-local'

const createStrategy = options => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: error =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: error => `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'password',
    successRedirect: '/leagues',
    ...options
  }
})

export default createStrategy