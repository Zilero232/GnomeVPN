import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, resolveLocale } from '../config';

describe('resolveLocale', () => {
  it('keeps a supported locale', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('ru')).toBe('ru');
  });

  it('falls back to the default when nothing is given', () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('')).toBe(DEFAULT_LOCALE);
  });

  it('falls back to the default for an unsupported locale', () => {
    expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('en-US')).toBe(DEFAULT_LOCALE);
  });

  it('matches case-sensitively, so an uppercase locale falls back', () => {
    expect(resolveLocale('EN')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('Ru')).toBe(DEFAULT_LOCALE);
  });

  it('defaults to russian', () => {
    expect(DEFAULT_LOCALE).toBe('ru');
  });
});
