import type { MetadataRoute } from 'next';

import { ROUTES } from '@/shared/constants';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

const PRIORITIES: Partial<Record<string, number>> = {
  [ROUTES.landing]: 1,
  [ROUTES.pricing]: 0.9,
  [ROUTES.setup]: 0.8,
  [ROUTES.servers]: 0.8,
  [ROUTES.blog]: 0.7,
  [ROUTES.faq]: 0.7,
  [ROUTES.about]: 0.6,
  [ROUTES.privacy]: 0.3
};

const CHANGE_FREQUENCIES: Partial<Record<string, ChangeFrequency>> = {
  [ROUTES.landing]: 'weekly',
  [ROUTES.pricing]: 'weekly',
  [ROUTES.setup]: 'monthly',
  [ROUTES.servers]: 'monthly',
  [ROUTES.blog]: 'weekly',
  [ROUTES.faq]: 'monthly',
  [ROUTES.about]: 'yearly',
  [ROUTES.privacy]: 'yearly'
};

export const SITEMAP = {
  priorities: PRIORITIES,
  changeFrequencies: CHANGE_FREQUENCIES,
  postPriority: 0.6,
  postChangeFrequency: 'monthly'
} as const;
