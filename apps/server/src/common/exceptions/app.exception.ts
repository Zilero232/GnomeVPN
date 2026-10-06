import type { ApiErrorCode } from '@gnomevpn/schemas';

import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common';

import type { AppErrorBody } from './app.exception.types';

const body = ({ code, error }: AppErrorBody) => ({ error, code });

class PaymentRequiredException extends HttpException {
  constructor(response: AppErrorBody) {
    super(response, 402);
  }
}

export class AppNotFoundException extends NotFoundException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}

export class AppForbiddenException extends ForbiddenException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}

export class AppUnauthorizedException extends UnauthorizedException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}

export class AppBadRequestException extends BadRequestException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}

export class AppPaymentRequiredException extends PaymentRequiredException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}

export class AppServiceUnavailableException extends ServiceUnavailableException {
  constructor(code: ApiErrorCode, error: string) {
    super(body({ code, error }));
  }
}
