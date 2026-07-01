import { Module } from '@nestjs/common';
import { SeasonModule } from '../season/season.module';
import { LeagueModule } from '../league/league.module';
import { LeagueCreationSaga } from './league-creation.saga';

@Module({
  imports: [SeasonModule, LeagueModule],
  providers: [LeagueCreationSaga],
})
export class LeagueCreationModule {}
