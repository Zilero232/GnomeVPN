import { describe, expect, it, vi } from 'vitest';

import { SITE } from '@/shared/config';

import { createPageMetadata } from '../page-metadata';

vi.mock('next/font/local', () => ({
  default: () => ({ className: 'font', variable: '--font', style: { fontFamily: 'font' } })
}));

const input = {
  title: 'Тарифы',
  description: 'Планы подписки.',
  path: '/pricing'
};

describe('createPageMetadata', () => {
  it('carries the title, description and og url through', () => {
    const metadata = createPageMetadata(input);

    expect(metadata.title).toBe(input.title);
    expect(metadata.description).toBe(input.description);
    expect(metadata.openGraph?.url).toBe(input.path);
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

    expect(metadata.alternates?.canonical).toBe(input.path);
  });

  it('defaults robots to neither indexing nor following', () => {
    expect(createPageMetadata(input).robots).toEqual({ index: false, follow: false });
  });

  it('reflects the requested robots flags', () => {
    expect(createPageMetadata({ ...input, index: true, follow: true }).robots).toEqual({ index: true, follow: true });
  });

  it('builds the og and twitter images from the site config', () => {
    const metadata = createPageMetadata(input);

    expect(metadata.openGraph?.images).toEqual([{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }]);
    expect(metadata.twitter?.images).toEqual([SITE.ogImage]);
  });
});
