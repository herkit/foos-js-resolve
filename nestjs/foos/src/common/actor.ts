import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * The authenticated principal behind a command.
 *
 * In reSolve these checks lived inside the aggregate command handlers, which
 * verified the JWT cookie directly. Here the domain stays pure: authorization
 * is expressed against an `Actor`, and obtaining/verifying it is the API layer's
 * job.
 *
 * PHASE 3 TODO: replace the dev-header extraction below with a real
 * `@nestjs/passport` JWT cookie guard that populates `request.user`.
 */
export interface Actor {
  id?: string;
  superuser?: boolean;
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: Actor }).user;
    if (user) return user;

    // Dev fallback until the JWT guard lands (Phase 3).
    return {
      id: (request.headers['x-actor-id'] as string) || undefined,
      superuser: request.headers['x-actor-superuser'] === 'true',
    };
  },
);
