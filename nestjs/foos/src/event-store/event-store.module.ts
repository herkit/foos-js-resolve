import { Global, Module, Logger } from '@nestjs/common';
import {
  getPostgreSQLEventStore,
  type PostgresEventStore,
} from '@event-driven-io/emmett-postgresql';
import { EVENT_STORE } from './event-store.constants';

const DEFAULT_CONNECTION_STRING = 'postgresql://foos:foos@localhost:5432/foos';

/**
 * Provides the Emmett PostgreSQL event store as an injectable singleton.
 *
 * Replaces the reSolve event-store adapter (`@resolve-js/eventstore-mysql`).
 * The store lazily provisions its schema on first use, so no migration step
 * is required for local development.
 */
@Global()
@Module({
  providers: [
    {
      provide: EVENT_STORE,
      useFactory: (): PostgresEventStore => {
        const connectionString =
          process.env.EVENTSTORE_CONNECTION_STRING ?? DEFAULT_CONNECTION_STRING;
        new Logger('EventStore').log(
          `Connecting to event store: ${connectionString.replace(/:[^:@/]*@/, ':****@')}`,
        );
        return getPostgreSQLEventStore(connectionString);
      },
    },
  ],
  exports: [EVENT_STORE],
})
export class EventStoreModule {}
