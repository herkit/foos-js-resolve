import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { EmmettError } from '@event-driven-io/emmett';
import type { Response } from 'express';

/**
 * Maps Emmett domain errors to HTTP responses.
 *
 * reSolve translated aggregate command errors into `4xx` responses; without
 * this filter Emmett's `IllegalStateError` / `ValidationError` /
 * `ConcurrencyError` would surface as opaque `500`s. Emmett errors carry an
 * `errorCode`; we honour it when it is a client-error status and otherwise
 * default domain rule violations to `400`.
 */
@Catch(EmmettError)
export class EmmettExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EmmettExceptionFilter.name);

  catch(error: EmmettError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const code = (error as EmmettError & { errorCode?: number }).errorCode;
    const status =
      typeof code === 'number' && code >= 400 && code < 500
        ? code
        : HttpStatus.BAD_REQUEST;

    this.logger.warn(`${error.name}: ${error.message}`);

    response.status(status).json({
      statusCode: status,
      message: error.message,
      error: error.name,
    });
  }
}
