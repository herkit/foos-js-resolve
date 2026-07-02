import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { EmmettExceptionFilter } from './common/emmett-exception.filter';

// Emmett stream versions are BigInt; Express' JSON serializer cannot handle
// BigInt, so command responses (which include `nextExpectedStreamVersion`)
// would fail to serialize. Emit BigInt as a string.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // API lives under /api so it doesn't clash with SPA routes (/players, /leagues).
  // The WebSocket gateway (socket.io) is unaffected by the HTTP prefix.
  app.setGlobalPrefix('api');
  // The kept React SPA is served from a different origin during development.
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new EmmettExceptionFilter());
  // Ensures onModuleDestroy runs on SIGINT/SIGTERM so the saga consumer
  // releases its processor lock cleanly on shutdown.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
