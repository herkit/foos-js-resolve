import { Global, Module, type OnModuleDestroy, Inject } from '@nestjs/common';
import { pongoClient, type PongoClient } from '@event-driven-io/pongo';

export const PONGO = Symbol('PONGO');

const DEFAULT_CONNECTION_STRING = 'postgresql://foos:foos@localhost:5432/foos';

/**
 * Provides a Pongo client for querying read-model collections. Shares the
 * event store's PostgreSQL database; read-model collections are plain tables
 * with a JSONB document column.
 */
@Global()
@Module({
  providers: [
    {
      provide: PONGO,
      useFactory: (): PongoClient =>
        pongoClient(
          process.env.EVENTSTORE_CONNECTION_STRING ?? DEFAULT_CONNECTION_STRING,
        ),
    },
  ],
  exports: [PONGO],
})
export class PongoModule implements OnModuleDestroy {
  constructor(@Inject(PONGO) private readonly client: PongoClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
