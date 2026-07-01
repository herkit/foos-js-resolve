import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentActor, type Actor } from '../common/actor';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { LeagueService } from './league.service';

@Controller('leagues')
export class LeagueController {
  constructor(private readonly leagues: LeagueService) {}

  @Post(':id')
  @UseGuards(JwtCookieGuard)
  create(
    @Param('id') id: string,
    @Body() body: { name: string; rating?: string },
    @CurrentActor() actor: Actor,
  ) {
    return this.leagues.createLeague(id, body, actor);
  }

  // `startSeason` is normally driven by the LeagueCreation saga; exposed for
  // completeness / manual operations.
  @Post(':id/seasons')
  startSeason(@Param('id') id: string, @Body() body: { seasonid: string }) {
    return this.leagues.startSeason(id, body);
  }
}
