import { describe, expect, it } from 'vitest';

import { timingSafeEqual } from '../timing-safe-equal';

describe('timingSafeEqual', () => {
  it('accepts two identical strings', () => {
    expect(timingSafeEqual('a-secret', 'a-secret')).toBe(true);
  });

  it('rejects strings that differ in content', () => {
    expect(timingSafeEqual('a-secret', 'b-secret')).toBe(false);
  });

  it('rejects strings that differ in length instead of throwing', () => {
    expect(timingSafeEqual('short', 'considerably-longer')).toBe(false);
  });

  it('rejects an empty string against a secret', () => {
    expect(timingSafeEqual('', 'a-secret')).toBe(false);
  });

  it('compares by bytes rather than by code units', () => {
    expect(timingSafeEqual('ключ', 'ключ')).toBe(true);
    expect(timingSafeEqual('ключ', 'клюя')).toBe(false);
  });
});
