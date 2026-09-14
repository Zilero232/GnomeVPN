import type { AuthErrorInput } from './auth-error.types';

import { AUTH_ERROR_KEY } from './auth-error.constants';

export const authErrorKey = ({ code, fallbackKey }: AuthErrorInput): string => {
  if (!code) {
    return fallbackKey;
  }

  return AUTH_ERROR_KEY[code as keyof typeof AUTH_ERROR_KEY] ?? fallbackKey;
};

export class AuthError extends Error {
  readonly code: string | undefined;

  constructor({ code, fallbackKey }: AuthErrorInput) {
    super(authErrorKey({ code, fallbackKey }));

    this.name = 'AuthError';
    this.code = code;
  }
}
