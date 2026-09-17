import type { z } from 'zod';

import type { subscriptionLinkSchema } from './subscription-link.schemas';

export type SubscriptionLink = z.infer<typeof subscriptionLinkSchema>;
