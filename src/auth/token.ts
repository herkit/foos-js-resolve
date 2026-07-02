import jwt from 'jsonwebtoken';
import { jwtSecret, type JwtClaims } from './auth.constants';

/**
 * Stateless JWT sign/verify — ports the `jsonwebtoken` usage from the reSolve
 * auth callbacks. Kept dependency-free so `JwtCookieGuard` can be used in any
 * controller without module coupling.
 */
export const signToken = (claims: JwtClaims): string =>
  jwt.sign(claims, jwtSecret());

export const verifyToken = (token: string): JwtClaims =>
  jwt.verify(token, jwtSecret()) as JwtClaims;
