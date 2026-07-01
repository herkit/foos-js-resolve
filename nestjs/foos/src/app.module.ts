import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventStoreModule } from './event-store/event-store.module';
import { PongoModule } from './read-models/pongo';
import { SeasonModule } from './season/season.module';
import { PlayerModule } from './player/player.module';
import { MatchModule } from './match/match.module';
import { LeagueModule } from './league/league.module';
import { LeagueCreationModule } from './sagas/league-creation.module';
import { ReadModelsModule } from './read-models/read-models.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PongoModule,
    EventStoreModule,
    SeasonModule,
    PlayerModule,
    MatchModule,
    LeagueModule,
    LeagueCreationModule,
    ReadModelsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
