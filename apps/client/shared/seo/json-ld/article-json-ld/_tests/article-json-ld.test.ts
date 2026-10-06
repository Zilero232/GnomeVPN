import { describe, expect, it } from 'vitest';

import { SITE } from '@/shared/config';
import { localePath, LOCALES } from '@/shared/i18n';

import { articleJsonLd } from '../article-json-ld';

const PATH = '/blog/some-post';

const build = (locale: (typeof LOCALES)[number]) => articleJsonLd({ headline: 'H', description: 'D', path: PATH, locale });

describe('articleJsonLd', () => {
  it('points each language at its own copy of the post, not at the default one', () => {
    for (const locale of LOCALES) {
      expect(build(locale).mainEntityOfPage['@id']).toBe(new URL(localePath({ path: PATH, locale }), SITE.url).toString());
    }
  });

  it('gives the two languages two different pages', () => {
    const ids = LOCALES.map((locale) => build(locale).mainEntityOfPage['@id']);

    expect(new Set(ids).size).toBe(LOCALES.length);
  });

  it('declares the language it was built for', () => {
    for (const locale of LOCALES) {
      expect(build(locale).inLanguage).toBe(locale);
    }
  });
});
