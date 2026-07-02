import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JWT_COOKIE_MAX_AGE, JWT_COOKIE_NAME } from './auth.constants';

/**
 * Slack OAuth routes — ported from the reSolve Slack login flow. Only mounted
 * when Slack is configured (see AuthModule). Not exercised in local tests
 * (requires real Slack credentials).
 */
@Controller('auth/slack')
export class SlackController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('slack'))
  login(): void {
    // Passport issues the redirect to Slack.
  }

  @Get('callback')
  @UseGuards(AuthGuard('slack'))
  async callback(
    @Req() req: Request & { user: unknown },
    @Res() res: Response,
  ): Promise<void> {
    const token = await this.auth.slackUpsert(
      req.user as {
        user: { email: string; name: string; id: string; image_192?: string };
      },
    );
    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: JWT_COOKIE_MAX_AGE,
      path: '/',
    });
    res.redirect('/leagues');
  }
}
