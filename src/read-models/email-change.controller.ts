import {
  Body,
  ConflictException,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { PlayerService } from '../player/player.service';
import { PlayersQueryService } from './players.query.service';

/**
 * Email-change flow — ported from `api/emailChange.js`.
 *
 * Combines a read (is the new email already taken?) with a write (the
 * `changeEmail` command) — the classic CQRS "process" that needs both sides.
 */
@Controller('players')
export class EmailChangeController {
  constructor(
    private readonly players: PlayersQueryService,
    private readonly playerCommands: PlayerService,
  ) {}

  @Post(':id/email-change')
  async changeEmail(
    @Param('id') id: string,
    @Body() body: { newEmail: string },
  ) {
    const existing = await this.players.byEmail(body.newEmail);
    if (existing && existing.id !== id) {
      throw new ConflictException('Email already in use');
    }
    return this.playerCommands.changeEmail(id, { newEmail: body.newEmail });
  }
}
