import type { MetadataRoute } from 'next';

import { ROUTES } from '@/shared/constants';

export const dynamic = 'force-static';

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: ROUTES.privacy,
    disallow: '/'
  }
});

export default robots;
