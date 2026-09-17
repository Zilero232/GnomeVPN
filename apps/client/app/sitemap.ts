import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';
import { indexedRoutes, ROUTES } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';

const PRIORITIES: Record<string, number> = {
  [ROUTES.landing]: 1,
  [ROUTES.pricing]: 0.9,
  [ROUTES.setup]: 0.8,
  [ROUTES.faq]: 0.7,
  [ROUTES.about]: 0.6,
  [ROUTES.privacy]: 0.3
};

const absolute = (path: string) => new URL(path, SITE.url).toString();

const sitemap = (): MetadataRoute.Sitemap =>
  indexedRoutes().flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absolute(localePath({ path, locale })),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: PRIORITIES[path] ?? 0.5,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((alternate) => [alternate, absolute(localePath({ path, locale: alternate }))]))
      }
    }))
  );

export default sitemap;
