/** Minimal ambient types for the untyped `passport-slack-oauth2` package. */
declare module 'passport-slack-oauth2' {
  export interface SlackStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL?: string;
    scope?: string[];
    skipUserProfile?: boolean;
    passReqToCallback?: boolean;
  }

  export type SlackVerify = (
    accessToken: string,
    refreshToken: string,
    profile: unknown,
    done: (error: unknown, user?: unknown) => void,
  ) => void;

  export class Strategy {
    constructor(options: SlackStrategyOptions, verify: SlackVerify);
    name: string;
  }
}
