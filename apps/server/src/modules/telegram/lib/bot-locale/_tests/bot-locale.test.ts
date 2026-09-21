import { describe, expect, it } from 'vitest';

import { resolveLocale } from '../bot-locale';

describe('resolveLocale', () => {
  it('reads the region off a full tag rather than expecting a bare language', () => {
    expect(resolveLocale('ru-RU')).toBe('ru');
    expect(resolveLocale('en-GB')).toBe('en');
  });

  it('ignores the case Telegram happens to send', () => {
    expect(resolveLocale('RU')).toBe('ru');
  });

  it('serves English to a language we do not speak, rather than guessing', () => {
    expect(resolveLocale('de')).toBe('en');
    expect(resolveLocale('zh-CN')).toBe('en');
  });

  it('serves English when the client reports nothing at all', () => {
    expect(resolveLocale(null)).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
    expect(resolveLocale('')).toBe('en');
  });
});
