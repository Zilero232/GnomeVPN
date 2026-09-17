import type { ApiErrorCode } from '@gnomevpn/schemas';

import { HttpStatus } from '@nestjs/common';

export const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.PAYMENT_REQUIRED]: 'PAYMENT_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN'
};

export const PRISMA_ERROR: Record<string, { status: number; code: ApiErrorCode }> = {
  P2025: { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND' },
  P2002: { status: HttpStatus.CONFLICT, code: 'CONFLICT' }
};
