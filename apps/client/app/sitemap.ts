import type { MetadataRoute } from 'next';

import { BLOG_SLUGS } from '@/entities/app/blog';
import { blogPostRoute, indexedRoutes, ROUTES } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';
import { absoluteUrl, languageAlternates } from '@/shared/seo';

const PRIORITIES: Record<string, number> = {
  [ROUTES.landing]: 1,
  [ROUTES.pricing]: 0.9,
  [ROUTES.setup]: 0.8,
  [ROUTES.servers]: 0.8,
  [ROUTES.blog]: 0.7,
  [ROUTES.faq]: 0.7,
  [ROUTES.about]: 0.6,
  [ROUTES.privacy]: 0.3
};

const CHANGE_FREQUENCIES: Record<string, MetadataRoute.Sitemap[number]['changeFrequency']> = {
  [ROUTES.landing]: 'weekly',
  [ROUTES.pricing]: 'weekly',
  [ROUTES.setup]: 'monthly',
  [ROUTES.servers]: 'monthly',
  [ROUTES.blog]: 'weekly',
  [ROUTES.faq]: 'monthly',
  [ROUTES.about]: 'yearly',
  [ROUTES.privacy]: 'yearly'
};

const absoluteLanguages = (path: string) =>
  Object.fromEntries(Object.entries(languageAlternates(path)).map(([locale, url]) => [locale, absoluteUrl(url)]));

const POST_PRIORITY = 0.6;

const BUILT_AT = new Date();

const sitemap = (): MetadataRoute.Sitemap => {
  const paths = [...indexedRoutes(), ...BLOG_SLUGS.map(blogPostRoute)];

  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localePath({ path, locale })),
      lastModified: BUILT_AT,
      changeFrequency: CHANGE_FREQUENCIES[path] ?? 'monthly',
      priority: PRIORITIES[path] ?? POST_PRIORITY,
      alternates: { languages: absoluteLanguages(path) }
    }))
  );
};

export default sitemap;
