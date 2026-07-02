import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
    // Serve the built SPA (vite build -> client-dist). API is under /api and is
    // excluded from the SPA fallback so it isn't shadowed by index.html.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client-dist'),
      exclude: ['/api/{*path}'],
    }),
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
