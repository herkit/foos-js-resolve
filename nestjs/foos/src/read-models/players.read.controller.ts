import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { PlayersQueryService } from './players.query.service';

/**
 * Read (query) endpoints for players. Maps to the frontend's `useQuery`
 * against the `Players` read-model resolvers.
 *
 * Static segments (`names`, `by-email`, `autocomplete`) are declared before the
 * `:id` route so they are matched first.
 */
@Controller('players')
export class PlayersReadController {
  constructor(private readonly players: PlayersQueryService) {}

  @Get()
  all() {
    return this.players.all();
  }

  @Get('names')
  names() {
    return this.players.allNames();
  }

  @Get('autocomplete')
  autocomplete() {
    return this.players.autocomplete();
  }

  @Get('by-email')
  byEmail(@Query('email') email: string) {
    return this.players.byEmail(email);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const player = await this.players.getById(id);
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  @Get(':id/matches')
  matches(@Param('id') id: string) {
    return this.players.matches(id);
  }
}
