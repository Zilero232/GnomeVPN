import type { UnwrapAuthInput } from './unwrap-auth.types';

import { AuthError } from '../auth-error';

export const unwrapAuth = <T>({ result, fallbackKey }: UnwrapAuthInput<T>): T => {
  if (result.error) {
    throw new AuthError({ code: result.error.code, fallbackKey });
  }

  return result.data;
};
