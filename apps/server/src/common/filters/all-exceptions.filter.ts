import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const hasCode = typeof res === 'object' && res !== null && 'code' in res;
      response.status(exception.getStatus()).json(
        hasCode ? res : { error: exception.message, code: 'INTERNAL_ERROR' },
      );
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
