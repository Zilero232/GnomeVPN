import { describe, expect, it } from 'vitest';

import { CALLBACK_PREFIX } from '../../../config';
import { callbackPattern } from '../callback';

describe('callbackPattern', () => {
  it('matches a payload carrying the prefix', () => {
    expect(callbackPattern(CALLBACK_PREFIX.plan).test(`${CALLBACK_PREFIX.plan}monthly`)).toBe(true);
    expect(callbackPattern(CALLBACK_PREFIX.locale).test(`${CALLBACK_PREFIX.locale}ru`)).toBe(true);
  });

  it('anchors at the start rather than matching anywhere', () => {
    expect(callbackPattern(CALLBACK_PREFIX.plan).test(`x${CALLBACK_PREFIX.plan}monthly`)).toBe(false);
  });

  it('keeps the two prefixes apart', () => {
    expect(callbackPattern(CALLBACK_PREFIX.plan).test(`${CALLBACK_PREFIX.locale}ru`)).toBe(false);
  });

  it('treats a metacharacter as a literal instead of a wildcard', () => {
    const pattern = callbackPattern('a.c:');

    expect(pattern.test('a.c:1')).toBe(true);
    expect(pattern.test('abc:1')).toBe(false);
  });

  it('returns a fresh pattern so a global flag cannot carry state between calls', () => {
    const payload = `${CALLBACK_PREFIX.plan}monthly`;

    expect(callbackPattern(CALLBACK_PREFIX.plan).test(payload)).toBe(true);
    expect(callbackPattern(CALLBACK_PREFIX.plan).test(payload)).toBe(true);
  });
});
