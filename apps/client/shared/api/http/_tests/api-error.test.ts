import { describe, expect, it } from 'vitest';

import { ApiError, apiErrorCode, toApiError } from '../api-error';

describe('toApiError', () => {
  it('builds an ApiError from a valid body', () => {
    const error = toApiError({ error: 'Node is gone', code: 'NODE_NOT_FOUND' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.name).toBe('ApiError');
    expect(error?.message).toBe('Node is gone');
    expect(error?.code).toBe('NODE_NOT_FOUND');
  });

  it('returns null for a malformed shape', () => {
    expect(toApiError(null)).toBeNull();
    expect(toApiError(undefined)).toBeNull();
    expect(toApiError('boom')).toBeNull();
    expect(toApiError({})).toBeNull();
    expect(toApiError({ code: 'NOT_FOUND' })).toBeNull();
    expect(toApiError({ error: 42, code: 'NOT_FOUND' })).toBeNull();
  });

  it('coerces an unknown code to INTERNAL_ERROR instead of rejecting the body', () => {
    const error = toApiError({ error: 'Something odd', code: 'UNKNOWN' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.code).toBe('INTERNAL_ERROR');
  });

  it('coerces a non-string code the same way', () => {
    expect(toApiError({ error: 'Something odd', code: 7 })?.code).toBe('INTERNAL_ERROR');
  });
});

describe('apiErrorCode', () => {
  it('reads the code off an ApiError', () => {
    expect(apiErrorCode(new ApiError('FORBIDDEN', 'Nope'))).toBe('FORBIDDEN');
  });

  it('falls back to INTERNAL_ERROR for anything else', () => {
    expect(apiErrorCode(new Error('Nope'))).toBe('INTERNAL_ERROR');
    expect(apiErrorCode('NOT_FOUND')).toBe('INTERNAL_ERROR');
    expect(apiErrorCode(undefined)).toBe('INTERNAL_ERROR');
    expect(apiErrorCode(null)).toBe('INTERNAL_ERROR');
  });
});
