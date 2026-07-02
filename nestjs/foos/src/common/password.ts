import { createHash } from 'crypto';

/**
 * SHA-256 (base64) password hash — ported verbatim from `auth/passwordhash.js`
 * so migrated `PLAYER_CREATED` events and existing logins stay compatible.
 */
export const hashPassword = (password: string): string =>
  createHash('sha256').update(password).digest('base64');
