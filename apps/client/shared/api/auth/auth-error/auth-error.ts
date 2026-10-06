import type { AuthErrorInput } from './auth-error.types';

import { AUTH_ERROR_KEY } from './auth-error.constants';

const isKnownCode = (code: string): code is keyof typeof AUTH_ERROR_KEY => Object.hasOwn(AUTH_ERROR_KEY, code);

export const authErrorKey = ({ code, fallbackKey }: AuthErrorInput): string => {
  if (!code || !isKnownCode(code)) {
    return fallbackKey;
  }

  return AUTH_ERROR_KEY[code];
};

export class AuthError extends Error {
  readonly code: string | undefined;

  constructor({ code, fallbackKey }: AuthErrorInput) {
    super(authErrorKey({ code, fallbackKey }));

    this.name = 'AuthError';
    this.code = code;
  }
}
