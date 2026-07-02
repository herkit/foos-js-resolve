import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { verifyToken } from './token';
import { JWT_COOKIE_NAME } from './auth.constants';
import type { Actor } from '../common/actor';

/**
 * Verifies the JWT cookie and populates `request.user` with the `Actor`.
 * Replaces the dev-header stand-in used in phases 1-2. Use on endpoints that
 * require authentication (e.g. create league, delete player).
 *
 * Stateless (no injected dependencies) so it can be applied in any controller
 * without importing AuthModule.
 */
@Injectable()
export class JwtCookieGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { cookies?: Record<string, string>; user?: Actor }>();

    const token = request.cookies?.[JWT_COOKIE_NAME];
    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      const claims = verifyToken(token);
      request.user = { id: claims.id, superuser: claims.superuser };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
