import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * The authenticated principal behind a command.
 *
 * In reSolve these checks lived inside the aggregate command handlers, which
 * verified the JWT cookie directly. Here the domain stays pure: authorization
 * is expressed against an `Actor`, and verifying/obtaining it is the API layer's
 * job — see `JwtCookieGuard`, which populates `request.user`.
 */
export interface Actor {
  id?: string;
  superuser?: boolean;
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: Actor }>();
    return request.user ?? {};
  },
);
