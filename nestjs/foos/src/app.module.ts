import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventStoreModule } from './event-store/event-store.module';
import { SeasonModule } from './season/season.module';
import { PlayerModule } from './player/player.module';
import { MatchModule } from './match/match.module';
import { LeagueModule } from './league/league.module';
import { LeagueCreationModule } from './sagas/league-creation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventStoreModule,
    SeasonModule,
    PlayerModule,
    MatchModule,
    LeagueModule,
    LeagueCreationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
