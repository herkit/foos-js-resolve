import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IllegalStateError } from '@event-driven-io/emmett';
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
          // The processor lock is leased. After a hard kill (SIGKILL) the dead
          // process's lease lingers, so a restart can't acquire it. A short
          // lease timeout lets a restart treat the dead holder's lock as stale
          // and steal it, and retry rides out the remaining lease window — so
          // dev restarts self-heal without a Postgres restart. (A clean Ctrl+C
          // shutdown releases the lock immediately via onModuleDestroy.)
          lock: {
            timeoutSeconds: 10,
            acquisitionPolicy: {
              type: 'retry',
              retries: 15,
              minTimeout: 1000,
              maxTimeout: 2000,
            },
          },
          eachMessage: async (message) => {
            const streamName = message.metadata.streamName;
            try {
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
            } catch (error) {
              // The reactor has at-least-once delivery, so a reaction may be
              // replayed (e.g. after a restart before the checkpoint advanced).
              // Domain conflicts mean the effect was already applied — treat as
              // a no-op so the processor advances instead of halting. Anything
              // else is likely transient, so rethrow to let it retry.
              if (error instanceof IllegalStateError) {
                this.logger.debug(
                  `Skipping already-applied reaction for ${message.type}: ${error.message}`,
                );
                return;
              }
              throw error;
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
