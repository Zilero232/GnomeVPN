import type { MetadataRoute } from 'next';

import { indexedRoutes, ROUTES } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';
import { absoluteUrl } from '@/shared/seo';

const PRIORITIES: Record<string, number> = {
  [ROUTES.landing]: 1,
  [ROUTES.pricing]: 0.9,
  [ROUTES.setup]: 0.8,
  [ROUTES.faq]: 0.7,
  [ROUTES.about]: 0.6,
  [ROUTES.privacy]: 0.3
};

const sitemap = (): MetadataRoute.Sitemap =>
  indexedRoutes().flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localePath({ path, locale })),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: PRIORITIES[path] ?? 0.5,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((alternate) => [alternate, absoluteUrl(localePath({ path, locale: alternate }))]))
      }
    }))
  );

export default sitemap;
