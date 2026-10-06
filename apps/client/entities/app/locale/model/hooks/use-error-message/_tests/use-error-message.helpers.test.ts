import { isPlainObject } from 'remeda';
import { describe, expect, it } from 'vitest';

import { ApiError, AuthError } from '@/shared/api';
import { messages } from '@/shared/i18n';

import { errorMessageKey } from '../use-error-message.helpers';

const resolve = (key: string): unknown => key.split('.').reduce<unknown>((node, part) => (isPlainObject(node) ? node[part] : undefined), messages.en);

describe('errorMessageKey', () => {
  it('reads an API failure by its code, never by the server prose', () => {
    const error = new ApiError({ code: 'TRIAL_ALREADY_USED', message: 'This account has already had its trial' });

    expect(errorMessageKey(error)).toBe('errors.TRIAL_ALREADY_USED');
  });

  it('reads an auth failure under the auth namespace, where its key lives', () => {
    const error = new AuthError({ code: 'INVALID_PASSWORD', fallbackKey: 'errors.passwordResetFailed' });

    expect(typeof resolve(errorMessageKey(error))).toBe('string');
  });

  it('falls back to the generic message for anything thrown by the network or the runtime', () => {
    expect(errorMessageKey(new TypeError('Failed to fetch'))).toBe('errors.INTERNAL_ERROR');
    expect(errorMessageKey(undefined)).toBe('errors.INTERNAL_ERROR');
  });

  it('always lands on a message that exists', () => {
    const errors = [
      new ApiError({ code: 'NOT_FOUND', message: 'x' }),
      new AuthError({ code: undefined, fallbackKey: 'errors.signInFailed' }),
      new Error('raw')
    ];

    for (const error of errors) {
      expect(typeof resolve(errorMessageKey(error))).toBe('string');
    }
  });
});
