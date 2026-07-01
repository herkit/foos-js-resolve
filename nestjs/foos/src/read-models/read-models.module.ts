import { Module } from '@nestjs/common';
import { PlayerModule } from '../player/player.module';
import { PlayersQueryService } from './players.query.service';
import { LeaguesQueryService } from './leagues.query.service';
import { PlayersReadController } from './players.read.controller';
import { LeaguesReadController } from './leagues.read.controller';
import { EmailChangeController } from './email-change.controller';

/**
 * The query side: read-model query services + REST controllers.
 * Projections themselves are registered inline with the event store
 * (see EventStoreModule / read-model.projections.ts).
 */
@Module({
  imports: [PlayerModule],
  controllers: [
    PlayersReadController,
    LeaguesReadController,
    EmailChangeController,
  ],
  providers: [PlayersQueryService, LeaguesQueryService],
  exports: [PlayersQueryService, LeaguesQueryService],
})
export class ReadModelsModule {}
