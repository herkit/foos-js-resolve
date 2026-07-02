/**
 * Auth configuration — ported from the reSolve `jwtCookie` config and
 * `auth/jwt-secret.js`.
 */
export const JWT_COOKIE_NAME = 'jwt';

// 1 year, matching the original config.prod.js `jwtCookie.maxAge`.
export const JWT_COOKIE_MAX_AGE = 31536000000;

export const jwtSecret = (): string => process.env.JWT_SECRET ?? 'SECRETJWT';

/** Claims stored in the JWT (mirrors the original token payload). */
export interface JwtClaims {
  id: string;
  name?: string;
  email?: string;
  superuser?: boolean;
  method?: string;
  avatar?: string;
  slackid?: string;
}
