import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get(':id/ranks')
  ranks(@Param('id') id: string) {
    return this.seasons.getRanks(id);
  }
}
