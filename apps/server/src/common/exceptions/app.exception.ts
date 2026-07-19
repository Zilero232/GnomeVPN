import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import type { ApiErrorCode } from '@vesper/schemas';

const body = (code: ApiErrorCode, error: string) => ({ error, code });

export class PaymentRequiredException extends HttpException {
  constructor(response: { error: string; code: ApiErrorCode }) {
    super(response, 402);
  }
}

export class AppNotFoundException extends NotFoundException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}

export class AppForbiddenException extends ForbiddenException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}

export class AppUnauthorizedException extends UnauthorizedException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}

export class AppBadRequestException extends BadRequestException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}

export class AppPaymentRequiredException extends PaymentRequiredException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}

export class AppServiceUnavailableException extends ServiceUnavailableException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
