import type { MetadataRoute } from 'next';

import { BLOG_SLUGS } from '@/entities/app/blog';
import { blogPostRoute, indexedRoutes } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';
import { absoluteUrl, languageAlternates } from '@/shared/seo';

import { SITEMAP } from './sitemap.constants';

const absoluteLanguages = (path: string) =>
  Object.fromEntries(Object.entries(languageAlternates(path)).map(([locale, url]) => [locale, absoluteUrl(url)]));

const BUILT_AT = new Date();

const sitemap = (): MetadataRoute.Sitemap => {
  const paths = [...indexedRoutes(), ...BLOG_SLUGS.map(blogPostRoute)];

  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localePath({ path, locale })),
      lastModified: BUILT_AT,
      changeFrequency: SITEMAP.changeFrequencies[path] ?? SITEMAP.postChangeFrequency,
      priority: SITEMAP.priorities[path] ?? SITEMAP.postPriority,
      alternates: { languages: absoluteLanguages(path) }
    }))
  );
};

export default sitemap;
