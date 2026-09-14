import type { AuthResult } from './unwrap-auth.types';

import { AuthError } from '../auth-error';

export const unwrapAuth = <T>(result: AuthResult<T>, fallbackKey: string): T => {
  if (result.error) {
    throw new AuthError({ code: result.error.code, fallbackKey });
  }

  return result.data;
};
