import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor, type Actor } from '../common/actor';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { PlayerService } from './player.service';

interface CreatePlayerBody {
  username?: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

/**
 * REST surface for the Player aggregate. Command responses return the Emmett
 * `CommandHandlerResult` (includes `nextExpectedStreamVersion`).
 */
@Controller('players')
export class PlayerController {
  constructor(private readonly players: PlayerService) {}

  @Post(':id')
  create(@Param('id') id: string, @Body() body: CreatePlayerBody) {
    return this.players.createPlayer(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtCookieGuard)
  remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.players.deletePlayer(id, actor);
  }

  @Put(':id/default-league')
  setDefaultLeague(
    @Param('id') id: string,
    @Body() body: { id?: string; slug?: string },
  ) {
    return this.players.setDefaultLeague(id, body);
  }

  @Delete(':id/default-league')
  resetDefaultLeague(@Param('id') id: string) {
    return this.players.resetDefaultLeague(id);
  }

  @Put(':id/email')
  changeEmail(@Param('id') id: string, @Body() body: { newEmail: string }) {
    return this.players.changeEmail(id, body);
  }
}
