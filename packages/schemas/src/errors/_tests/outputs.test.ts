import { describe, expect, it } from 'vitest';

import { apiErrorSchema } from '../outputs';

describe('apiErrorSchema', () => {
  it('keeps a known error code', () => {
    expect(apiErrorSchema.parse({ error: 'nope', code: 'NOT_FOUND' })).toEqual({ error: 'nope', code: 'NOT_FOUND' });
  });

  it('keeps every domain-specific code', () => {
    expect(apiErrorSchema.parse({ error: 'nope', code: 'DEVICE_LIMIT_REACHED' }).code).toBe('DEVICE_LIMIT_REACHED');
    expect(apiErrorSchema.parse({ error: 'nope', code: 'PAYMENT_FAILED' }).code).toBe('PAYMENT_FAILED');
  });

  it('degrades an unknown code to an internal error', () => {
    expect(apiErrorSchema.parse({ error: 'nope', code: 'TEAPOT' }).code).toBe('INTERNAL_ERROR');
  });

  it('degrades a code of the wrong type to an internal error', () => {
    expect(apiErrorSchema.parse({ error: 'nope', code: 42 }).code).toBe('INTERNAL_ERROR');
    expect(apiErrorSchema.parse({ error: 'nope', code: null }).code).toBe('INTERNAL_ERROR');
  });

  it('degrades a missing code to an internal error', () => {
    expect(apiErrorSchema.parse({ error: 'nope' }).code).toBe('INTERNAL_ERROR');
  });

  it('still requires the error message', () => {
    expect(apiErrorSchema.safeParse({ code: 'NOT_FOUND' }).success).toBe(false);
  });
});
