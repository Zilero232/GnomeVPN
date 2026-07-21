import { SITE } from '@/shared/config';

import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/app', '/account', '/auth', '/reset-password'],
  },
  sitemap: `${SITE.url}/sitemap.xml`,
});

export default robots;
