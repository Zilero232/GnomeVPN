import { describe, expect, it } from 'vitest';

import { SITE } from '@/shared/config';
import { DEFAULT_LOCALE, LOCALES } from '@/shared/i18n';

import { breadcrumbJsonLd } from '../breadcrumb-json-ld';

const OTHER_LOCALE = LOCALES.find((locale) => locale !== DEFAULT_LOCALE) ?? DEFAULT_LOCALE;

describe('breadcrumbJsonLd', () => {
  it('starts at the site root and ends at the page', () => {
    const trail = breadcrumbJsonLd({ path: '/faq', name: 'FAQ', locale: DEFAULT_LOCALE }).itemListElement;

    expect(trail.map((item) => item.position)).toEqual([1, 2]);
    expect(trail[0].name).toBe(SITE.name);
    expect(trail[1].name).toBe('FAQ');
  });

  it('builds absolute urls, which is what a crawler needs', () => {
    const trail = breadcrumbJsonLd({ path: '/faq', name: 'FAQ', locale: DEFAULT_LOCALE }).itemListElement;

    expect(trail.every((item) => item.item.startsWith(SITE.url))).toBe(true);
  });

  it('keeps each locale on its own trail', () => {
    const russian = breadcrumbJsonLd({ path: '/faq', name: 'FAQ', locale: DEFAULT_LOCALE });
    const other = breadcrumbJsonLd({ path: '/faq', name: 'FAQ', locale: OTHER_LOCALE });

    expect(russian.itemListElement[1].item).not.toBe(other.itemListElement[1].item);
  });
});
