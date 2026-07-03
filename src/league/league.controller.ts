import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentActor, type Actor } from '../common/actor';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { LeagueService } from './league.service';
import { LeagueStatsService } from './league-stats.service';

@Controller('leagues')
export class LeagueController {
  constructor(
    private readonly leagues: LeagueService,
    private readonly stats: LeagueStatsService,
  ) {}

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

  // Public read: a player's career stats across every season in this league.
  // Mirrors the public `GET /seasons/:id/ranks`.
  @Get(':id/players/:playerId/stats')
  playerStats(@Param('id') id: string, @Param('playerId') playerId: string) {
    return this.stats.getPlayerStats(id, playerId);
  }
}
