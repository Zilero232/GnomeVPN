import { describe, expect, it } from 'vitest';

import { AuthError, authErrorKey } from '../auth-error';

describe('authErrorKey', () => {
  it('falls back when the server sent no code', () => {
    expect(authErrorKey({ code: undefined, fallbackKey: 'errors.signUpFailed' })).toBe('errors.signUpFailed');
  });

  it('falls back on a code it does not know', () => {
    expect(authErrorKey({ code: 'SOMETHING_NEW', fallbackKey: 'errors.signInFailed' })).toBe('errors.signInFailed');
  });

  it('names the real problem when the email is taken, rather than blaming the whole sign-up', () => {
    expect(authErrorKey({ code: 'USER_ALREADY_EXISTS', fallbackKey: 'errors.signUpFailed' })).toBe('errors.emailTaken');
  });

  it('maps both spellings better-auth uses for a taken email', () => {
    const taken = authErrorKey({ code: 'USER_ALREADY_EXISTS', fallbackKey: 'errors.signUpFailed' });

    expect(authErrorKey({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', fallbackKey: 'errors.signUpFailed' })).toBe(taken);
  });

  it('gives wrong credentials one message, whichever half was wrong', () => {
    const invalid = authErrorKey({ code: 'INVALID_EMAIL_OR_PASSWORD', fallbackKey: 'errors.signInFailed' });

    expect(authErrorKey({ code: 'INVALID_PASSWORD', fallbackKey: 'errors.signInFailed' })).toBe(invalid);
  });

  it('returns a key under the auth namespace, which is what the forms translate against', () => {
    expect(authErrorKey({ code: 'EMAIL_NOT_VERIFIED', fallbackKey: 'errors.signInFailed' })).toMatch(/^errors\./);
  });
});

describe('AuthError', () => {
  it('carries the translation key as its message', () => {
    expect(new AuthError({ code: 'USER_ALREADY_EXISTS', fallbackKey: 'errors.signUpFailed' }).message).toBe('errors.emailTaken');
  });

  it('keeps the original code for logging', () => {
    expect(new AuthError({ code: 'USER_ALREADY_EXISTS', fallbackKey: 'errors.signUpFailed' }).code).toBe('USER_ALREADY_EXISTS');
  });

  it('is an Error, so existing onError handlers keep working', () => {
    expect(new AuthError({ code: undefined, fallbackKey: 'errors.signInFailed' })).toBeInstanceOf(Error);
  });
});
