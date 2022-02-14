import { Strategy as strategyFactory } from 'passport-slack-oauth2'

const createStrategy = options => ({
  factory: strategyFactory,
  options: {
    clientID: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    skipUserProfile: false, // default
    passReqToCallback: false,
    scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team'],
    ...options
  }
})

export default createStrategy