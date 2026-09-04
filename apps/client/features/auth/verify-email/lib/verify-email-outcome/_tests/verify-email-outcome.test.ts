import { describe, expect, it } from 'vitest';

import { verifyEmailErrorCode } from '../verify-email-outcome';

describe('verifyEmailErrorCode', () => {
  it('reports nothing when the link carried no error', () => {
    expect(verifyEmailErrorCode(null)).toBeNull();
  });

  it('treats an empty or blank parameter as no error', () => {
    expect(verifyEmailErrorCode('')).toBeNull();
    expect(verifyEmailErrorCode('   ')).toBeNull();
  });

  it('passes every code better-auth can redirect with straight through', () => {
    expect(verifyEmailErrorCode('TOKEN_EXPIRED')).toBe('TOKEN_EXPIRED');
    expect(verifyEmailErrorCode('INVALID_TOKEN')).toBe('INVALID_TOKEN');
    expect(verifyEmailErrorCode('USER_NOT_FOUND')).toBe('USER_NOT_FOUND');
    expect(verifyEmailErrorCode('INVALID_USER')).toBe('INVALID_USER');
  });

  it('accepts a lowercased code, since the value travels through a url', () => {
    expect(verifyEmailErrorCode('token_expired')).toBe('TOKEN_EXPIRED');
  });

  it('trims surrounding whitespace before matching', () => {
    expect(verifyEmailErrorCode(' INVALID_TOKEN ')).toBe('INVALID_TOKEN');
  });

  it('falls back to UNKNOWN for a code it has never seen', () => {
    expect(verifyEmailErrorCode('SOMETHING_NEW')).toBe('UNKNOWN');
  });

  it('never returns null for a non-empty value, so an error is always surfaced', () => {
    expect(verifyEmailErrorCode('!')).toBe('UNKNOWN');
  });
});
