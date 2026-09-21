import { describe, expect, it } from 'vitest';

import { LOCALE_CALLBACK_PREFIX, PLAN_CALLBACK_PREFIX } from '../../../config';
import { callbackPattern } from '../callback';

describe('callbackPattern', () => {
  it('matches a payload carrying the prefix', () => {
    expect(callbackPattern(PLAN_CALLBACK_PREFIX).test(`${PLAN_CALLBACK_PREFIX}monthly`)).toBe(true);
    expect(callbackPattern(LOCALE_CALLBACK_PREFIX).test(`${LOCALE_CALLBACK_PREFIX}ru`)).toBe(true);
  });

  it('anchors at the start rather than matching anywhere', () => {
    expect(callbackPattern(PLAN_CALLBACK_PREFIX).test(`x${PLAN_CALLBACK_PREFIX}monthly`)).toBe(false);
  });

  it('keeps the two prefixes apart', () => {
    expect(callbackPattern(PLAN_CALLBACK_PREFIX).test(`${LOCALE_CALLBACK_PREFIX}ru`)).toBe(false);
  });

  it('treats a metacharacter as a literal instead of a wildcard', () => {
    const pattern = callbackPattern('a.c:');

    expect(pattern.test('a.c:1')).toBe(true);
    expect(pattern.test('abc:1')).toBe(false);
  });

  it('returns a fresh pattern so a global flag cannot carry state between calls', () => {
    const payload = `${PLAN_CALLBACK_PREFIX}monthly`;

    expect(callbackPattern(PLAN_CALLBACK_PREFIX).test(payload)).toBe(true);
    expect(callbackPattern(PLAN_CALLBACK_PREFIX).test(payload)).toBe(true);
  });
});
