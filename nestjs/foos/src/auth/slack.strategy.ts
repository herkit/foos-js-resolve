import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-slack-oauth2';

export const slackConfigured = (): boolean =>
  !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);

/**
 * Slack OAuth strategy — ports `auth/slack/create-strategy.js`.
 * Passport sets `request.user` to whatever `validate` returns (the profile);
 * the callback route then upserts the player and issues the JWT.
 *
 * Only registered when SLACK_CLIENT_ID / SLACK_CLIENT_SECRET are configured
 * (see AuthModule).
 */
@Injectable()
export class SlackStrategy extends PassportStrategy(Strategy, 'slack') {
  constructor() {
    super({
      clientID: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      callbackURL:
        process.env.SLACK_CALLBACK_URL ??
        'http://localhost:3000/auth/slack/callback',
      scope: [
        'identity.basic',
        'identity.email',
        'identity.avatar',
        'identity.team',
      ],
      skipUserProfile: false,
      passReqToCallback: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: unknown,
  ): unknown {
    return profile;
  }
}
