import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';
import { indexedRoutes, ROUTES } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';

const PRIVATE_ROUTES = [ROUTES.account, ROUTES.auth, ROUTES.resetPassword];

const forEveryLocale = (paths: string[]) => paths.flatMap((path) => LOCALES.map((locale) => localePath({ path, locale })));

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: forEveryLocale(indexedRoutes()),
    disallow: forEveryLocale(PRIVATE_ROUTES)
  },
  sitemap: new URL('/sitemap.xml', SITE.url).toString(),
  host: SITE.url
});

export default robots;
