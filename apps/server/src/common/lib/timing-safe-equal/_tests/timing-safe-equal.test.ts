import { describe, expect, it } from 'vitest';

import { timingSafeEqual } from '../timing-safe-equal';

describe('timingSafeEqual', () => {
  it('accepts two identical strings', () => {
    expect(timingSafeEqual({ actual: 'a-secret', expected: 'a-secret' })).toBe(true);
  });

  it('rejects strings that differ in content', () => {
    expect(timingSafeEqual({ actual: 'a-secret', expected: 'b-secret' })).toBe(false);
  });

  it('rejects strings that differ in length instead of throwing', () => {
    expect(timingSafeEqual({ actual: 'short', expected: 'considerably-longer' })).toBe(false);
  });

  it('rejects an empty string against a secret', () => {
    expect(timingSafeEqual({ actual: '', expected: 'a-secret' })).toBe(false);
  });

  it('compares by bytes rather than by code units', () => {
    expect(timingSafeEqual({ actual: 'ключ', expected: 'ключ' })).toBe(true);
    expect(timingSafeEqual({ actual: 'ключ', expected: 'клюя' })).toBe(false);
  });
});
