import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { localePath, LOCALES } from '@/shared/i18n';

const PRIVATE_ROUTES = [ROUTES.account, ROUTES.auth, ROUTES.resetPassword, ROUTES.telegramSignIn];

const forEveryLocale = (paths: string[]) => paths.flatMap((path) => LOCALES.map((locale) => localePath({ path, locale })));

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: forEveryLocale(PRIVATE_ROUTES)
  },
  sitemap: new URL('/sitemap.xml', SITE.url).toString(),
  host: SITE.url
});

export default robots;
