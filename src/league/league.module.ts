import { Module } from '@nestjs/common';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';
import { LeagueStatsService } from './league-stats.service';

@Module({
  controllers: [LeagueController],
  providers: [LeagueService, LeagueStatsService],
  exports: [LeagueService],
})
export class LeagueModule {}
