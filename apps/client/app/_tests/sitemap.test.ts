import { describe, expect, it } from 'vitest';

import { BLOG_SLUGS } from '@/entities/app/blog';
import { blogPostRoute, indexedRoutes, ROUTES } from '@/shared/constants';
import { LOCALES } from '@/shared/i18n';

import sitemap from '../sitemap';
import { SITEMAP } from '../sitemap.constants';

describe('sitemap', () => {
  it('ranks every indexed page explicitly, because a missing entry falls back silently', () => {
    for (const path of indexedRoutes()) {
      expect(SITEMAP.priorities[path]).toBeDefined();
      expect(SITEMAP.changeFrequencies[path]).toBeDefined();
    }
  });

  it('ranks no page that is not indexed', () => {
    expect(Object.keys(SITEMAP.priorities).sort()).toEqual(indexedRoutes().sort());
    expect(Object.keys(SITEMAP.changeFrequencies).sort()).toEqual(indexedRoutes().sort());
  });

  it('puts the landing page above every other page', () => {
    const landing = SITEMAP.priorities[ROUTES.landing] ?? 0;
    const others = indexedRoutes().filter((path) => path !== ROUTES.landing);

    for (const path of others) {
      expect(SITEMAP.priorities[path]).toBeLessThan(landing);
    }
  });

  it('lists every indexed page and every post once per locale', () => {
    expect(sitemap()).toHaveLength((indexedRoutes().length + BLOG_SLUGS.length) * LOCALES.length);
  });

  it('gives a post the post defaults rather than a page entry', () => {
    const [slug] = BLOG_SLUGS;
    const post = sitemap().find(({ url }) => new URL(url).pathname === blogPostRoute(slug));

    expect(post?.priority).toBe(SITEMAP.postPriority);
    expect(post?.changeFrequency).toBe(SITEMAP.postChangeFrequency);
  });
});
