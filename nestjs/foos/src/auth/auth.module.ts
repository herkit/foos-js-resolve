import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtCookieGuard } from './jwt-cookie.guard';
import { SlackController } from './slack.controller';
import { SlackStrategy, slackConfigured } from './slack.strategy';
import { PlayerModule } from '../player/player.module';
import { ReadModelsModule } from '../read-models/read-models.module';

// Slack routes/strategy are only wired when credentials are present, so the
// app boots without Slack configured.
const slackEnabled = slackConfigured();
if (!slackEnabled) {
  new Logger('AuthModule').log(
    'Slack OAuth disabled (SLACK_CLIENT_ID / SLACK_CLIENT_SECRET not set)',
  );
}

@Module({
  imports: [PlayerModule, ReadModelsModule, PassportModule],
  controllers: [AuthController, ...(slackEnabled ? [SlackController] : [])],
  providers: [
    AuthService,
    JwtCookieGuard,
    ...(slackEnabled ? [SlackStrategy] : []),
  ],
  exports: [AuthService, JwtCookieGuard],
})
export class AuthModule {}
