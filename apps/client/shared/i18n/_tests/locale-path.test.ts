import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES } from '../config';
import { localePath } from '../locale-path';

const OTHER_LOCALE = LOCALES.find((locale) => locale !== DEFAULT_LOCALE) ?? DEFAULT_LOCALE;

describe('localePath', () => {
  it('leaves the default locale unprefixed, which is what the router serves', () => {
    expect(localePath({ path: '/pricing', locale: DEFAULT_LOCALE })).toBe('/pricing');
  });

  it('prefixes every other locale', () => {
    expect(localePath({ path: '/pricing', locale: OTHER_LOCALE })).toBe(`/${OTHER_LOCALE}/pricing`);
  });

  it('keeps the root path addressable in the default locale', () => {
    expect(localePath({ path: '/', locale: DEFAULT_LOCALE })).toBe('/');
  });

  it('turns the root path into a bare locale prefix elsewhere', () => {
    expect(localePath({ path: '/', locale: OTHER_LOCALE })).toBe(`/${OTHER_LOCALE}`);
  });

  it('gives each locale a distinct url, so canonicals never collide', () => {
    const paths = LOCALES.map((locale) => localePath({ path: '/faq', locale }));

    expect(new Set(paths).size).toBe(LOCALES.length);
  });
});
