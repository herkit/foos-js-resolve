import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentActor, type Actor } from '../common/actor';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { SeasonService } from './season.service';

interface CreateSeasonBody {
  leagueid: string;
  rating?: string;
}

interface RegisterMatchBody {
  matchid: string;
  winners: string[];
  losers: string[];
}

interface CorrectMatchBody {
  winners: string[];
  losers: string[];
  reason: string;
}

interface VoidMatchBody {
  reason: string;
}

/**
 * REST surface for the Season slice.
 *
 * Replaces reSolve's implicit command/query HTTP API. The frontend's
 * `useCommand` maps to the POST routes and `useQuery` to the GET route.
 */
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasons: SeasonService) {}

  @Post(':id')
  create(@Param('id') id: string, @Body() body: CreateSeasonBody) {
    return this.seasons.createSeason(id, {
      leagueid: body.leagueid,
      rating: body.rating,
    });
  }

  @Post(':id/matches')
  registerMatch(@Param('id') id: string, @Body() body: RegisterMatchBody) {
    return this.seasons.registerMatch(id, {
      matchid: body.matchid,
      winners: body.winners,
      losers: body.losers,
    });
  }

  @Post(':id/matches/:matchid/correct')
  @UseGuards(JwtCookieGuard)
  correctMatch(
    @Param('id') id: string,
    @Param('matchid') matchid: string,
    @Body() body: CorrectMatchBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.seasons.correctMatch(
      id,
      {
        matchid,
        winners: body.winners,
        losers: body.losers,
        reason: body.reason,
      },
      actor,
    );
  }

  @Post(':id/matches/:matchid/void')
  @UseGuards(JwtCookieGuard)
  voidMatch(
    @Param('id') id: string,
    @Param('matchid') matchid: string,
    @Body() body: VoidMatchBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.seasons.voidMatch(id, { matchid, reason: body.reason }, actor);
  }

  @Get(':id/ranks')
  ranks(@Param('id') id: string) {
    return this.seasons.getRanks(id);
  }
}
