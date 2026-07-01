import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  postgreSQLEventStoreConsumer,
  postgreSQLReactor,
  type PostgreSQLEventStoreConsumer,
} from '@event-driven-io/emmett-postgresql';
import type { LeagueCreated } from '../league/league.events';
import type { SeasonCreated } from '../season/season.events';
import { SeasonService } from '../season/season.service';
import { LeagueService } from '../league/league.service';

type SagaMessage = LeagueCreated | SeasonCreated;

const idFromStream = (streamName: string, prefix: string): string =>
  streamName.slice(prefix.length);

const DEFAULT_CONNECTION_STRING = 'postgresql://foos:foos@localhost:5432/foos';

/**
 * LeagueCreation saga — ported from `common/sagas/league-creation.saga.js`.
 *
 * Implemented as a durable Emmett reactor driven by a PostgreSQL consumer, so
 * reactions survive restarts and are not reprocessed (per-processor checkpoint).
 *
 *   LEAGUE_CREATED  -> Season.createSeason (new season id)
 *   SEASON_CREATED  -> League.startSeason
 */
@Injectable()
export class LeagueCreationSaga
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(LeagueCreationSaga.name);
  private consumer?: PostgreSQLEventStoreConsumer;

  constructor(
    private readonly seasons: SeasonService,
    private readonly leagues: LeagueService,
  ) {}

  onApplicationBootstrap(): void {
    const connectionString =
      process.env.EVENTSTORE_CONNECTION_STRING ?? DEFAULT_CONNECTION_STRING;

    this.consumer = postgreSQLEventStoreConsumer<SagaMessage>({
      connectionString,
      processors: [
        postgreSQLReactor<SagaMessage>({
          processorId: 'league-creation-saga',
          canHandle: ['LEAGUE_CREATED', 'SEASON_CREATED'],
          eachMessage: async (message) => {
            const streamName = message.metadata.streamName;
            if (message.type === 'LEAGUE_CREATED') {
              const leagueId = idFromStream(streamName, 'league-');
              const seasonId = randomUUID();
              await this.seasons.createSeason(seasonId, {
                leagueid: leagueId,
                rating: message.data.rating,
              });
              this.logger.log(
                `LEAGUE_CREATED(${leagueId}) -> createSeason(${seasonId})`,
              );
            } else if (message.type === 'SEASON_CREATED') {
              const seasonId = idFromStream(streamName, 'season-');
              await this.leagues.startSeason(message.data.leagueid, {
                seasonid: seasonId,
              });
              this.logger.log(
                `SEASON_CREATED(${seasonId}) -> startSeason(league ${message.data.leagueid})`,
              );
            }
          },
        }),
      ],
    });

    // Do not await: start() runs the polling loop for the consumer's lifetime.
    this.consumer.start().catch((err) => {
      this.logger.error('LeagueCreation consumer stopped unexpectedly', err);
    });
    this.logger.log('LeagueCreation saga consumer started');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.consumer) return;
    await this.consumer.stop();
    await this.consumer.close();
  }
}
