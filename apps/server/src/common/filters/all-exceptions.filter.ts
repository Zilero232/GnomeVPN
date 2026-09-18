import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { isNonNullish, isObjectType } from 'remeda';

import { isPrismaRequestError } from '../../core';
import { PRISMA_ERROR } from './all-exceptions.constants';
import { codeForStatus } from './all-exceptions.helpers';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const hasCode = isObjectType(res) && isNonNullish(res) && 'code' in res;
      const status = exception.getStatus();

      response.status(status).json(hasCode ? res : { error: exception.message, code: codeForStatus(status) });

      return;
    }

    if (isPrismaRequestError(exception)) {
      const mapped = PRISMA_ERROR[exception.code];

      if (mapped) {
        response.status(mapped.status).json({ error: mapped.code, code: mapped.code });

        return;
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
