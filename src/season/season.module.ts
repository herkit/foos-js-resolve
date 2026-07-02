import { Module } from '@nestjs/common';
import { LeagueModule } from '../league/league.module';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { SeasonGateway } from './season.gateway';

/**
 * Season vertical slice — the reference implementation every other aggregate
 * follows during the reSolve -> NestJS migration.
 *
 * Depends on the globally-provided Emmett event store (see EventStoreModule).
 */
@Module({
  imports: [LeagueModule],
  controllers: [SeasonController],
  providers: [SeasonService, SeasonGateway],
  exports: [SeasonService],
})
export class SeasonModule {}
