import type { ApiErrorCode } from '@gnomevpn/schemas';

import { apiErrorCodeSchema } from '@gnomevpn/schemas';
import { HttpException } from '@nestjs/common';
import { isObjectType } from 'remeda';

export const errorCodeOf = (error: unknown): ApiErrorCode | null => {
  if (!(error instanceof HttpException)) {
    return null;
  }

  const response = error.getResponse();

  if (!isObjectType(response) || !('code' in response)) {
    return null;
  }

  const parsed = apiErrorCodeSchema.safeParse(response.code);

  return parsed.success ? parsed.data : null;
};
