import type { ApiErrorCode } from '@gnomevpn/schemas';

import { apiErrorSchema } from '@gnomevpn/schemas';

import type { ApiErrorInput } from './api-error.types';

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor({ code, message }: ApiErrorInput) {
    super(message);

    this.name = 'ApiError';
    this.code = code;
  }
}

export const toApiError = (data: unknown) => {
  const parsed = apiErrorSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return new ApiError({ code: parsed.data.code, message: parsed.data.error });
};

export const apiErrorCode = (error: unknown): ApiErrorCode => (error instanceof ApiError ? error.code : 'INTERNAL_ERROR');
