import { describe, expect, it, vi } from 'vitest';

import { SITE } from '@/shared/config';
import { DEFAULT_LOCALE, localePath, LOCALES } from '@/shared/i18n';

import { createPageMetadata } from '../page-metadata';

vi.mock('next/font/local', () => ({
  default: () => ({ className: 'font', variable: '--font', style: { fontFamily: 'font' } })
}));

const input = {
  title: 'Тарифы',
  description: 'Планы подписки.',
  path: '/pricing',
  locale: DEFAULT_LOCALE
};

describe('createPageMetadata', () => {
  it('carries the title, description and og url through', () => {
    const metadata = createPageMetadata(input);

    expect(metadata.title).toEqual({ absolute: `${input.title} · ${SITE.name}` });
    expect(metadata.description).toBe(input.description);
    expect(metadata.openGraph?.url).toBe(localePath({ path: input.path, locale: input.locale }));
  });

  it('brands the title exactly once, rather than letting the root template append a second time', () => {
    const named = createPageMetadata({ ...input, title: `${SITE.name} — тарифы` });

    expect(named.title).toEqual({ absolute: `${SITE.name} — тарифы` });
  });

  it('appends the site name to a title that lacks it', () => {
    const metadata = createPageMetadata(input);

    expect(metadata.openGraph?.title).toBe(`${input.title} · ${SITE.name}`);
    expect(metadata.twitter?.title).toBe(`${input.title} · ${SITE.name}`);
  });

  it('leaves a title that already names the site alone', () => {
    const metadata = createPageMetadata({ ...input, title: `${SITE.name} — тарифы` });

    expect(metadata.openGraph?.title).toBe(`${SITE.name} — тарифы`);
    expect(metadata.twitter?.title).toBe(`${SITE.name} — тарифы`);
  });

  it('omits the canonical link unless the page is indexed', () => {
    expect(createPageMetadata(input).alternates).toBeUndefined();
    expect(createPageMetadata({ ...input, index: false }).alternates).toBeUndefined();
  });

  it('adds the canonical link for an indexed page', () => {
    const metadata = createPageMetadata({ ...input, index: true });

    expect(metadata.alternates?.canonical).toBe(localePath({ path: input.path, locale: input.locale }));
  });

  it('points an indexed page at every locale it is served in', () => {
    const languages = createPageMetadata({ ...input, index: true }).alternates?.languages ?? {};

    expect(Object.keys(languages)).toEqual([...LOCALES, 'x-default']);
  });

  it('canonicalises each locale to its own url', () => {
    const forEnglish = createPageMetadata({ ...input, locale: 'en', index: true });
    const forRussian = createPageMetadata({ ...input, locale: 'ru', index: true });

    expect(forEnglish.alternates?.canonical).not.toBe(forRussian.alternates?.canonical);
  });

  it('defaults robots to neither indexing nor following', () => {
    expect(createPageMetadata(input).robots).toEqual({ index: false, follow: false });
  });

  it('reflects the requested robots flags', () => {
    expect(createPageMetadata({ ...input, index: true, follow: true }).robots).toEqual({ index: true, follow: true });
  });

  it('names no image, so the generated opengraph-image is not overridden by a static one', () => {
    const metadata = createPageMetadata(input);

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
  });
});
