import type { ApiErrorCode } from '@gnomevpn/schemas';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import { Prisma } from '../../../generated';

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN'
};

const codeForStatus = (status: number): ApiErrorCode => STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';

const PRISMA_ERROR: Record<string, { status: number; code: ApiErrorCode }> = {
  P2025: { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND' },
  P2002: { status: HttpStatus.CONFLICT, code: 'CONFLICT' }
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const hasCode = typeof res === 'object' && isNonNullish(res) && 'code' in res;
      const status = exception.getStatus();
      response
        .status(status)
        .json(hasCode ? res : { error: exception.message, code: codeForStatus(status) });

      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR[exception.code];

      if (mapped) {
        response.status(mapped.status).json({ error: mapped.code, code: mapped.code });

        return;
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
