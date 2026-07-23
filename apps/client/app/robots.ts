import { ROUTES } from '@/shared/constants';

import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: ROUTES.privacy,
    disallow: '/',
  },
});

export default robots;
