import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  JWT_COOKIE_MAX_AGE,
  JWT_COOKIE_NAME,
  type JwtClaims,
} from './auth.constants';

interface CredentialsBody {
  username: string;
  password: string;
}

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: JWT_COOKIE_MAX_AGE,
    path: '/',
  });
};

/**
 * Local auth endpoints — port `auth/route-login-callback.js` and
 * `auth/route-register-callback.js`. The signed JWT is delivered as an
 * httpOnly cookie (matching the original `jwtCookie` transport).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() body: CredentialsBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.auth.register(body.username, body.password);
    setAuthCookie(res, token);
    return { ok: true };
  }

  @Post('login')
  async login(
    @Body() body: CredentialsBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.auth.login(body.username, body.password);
    setAuthCookie(res, token);
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(JWT_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@Req() req: Request & { cookies?: Record<string, string> }): JwtClaims {
    const token = req.cookies?.[JWT_COOKIE_NAME];
    if (!token) throw new UnauthorizedException('Not authenticated');
    try {
      return this.auth.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
