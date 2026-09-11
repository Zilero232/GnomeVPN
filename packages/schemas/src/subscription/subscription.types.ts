import type { z } from 'zod';

import type { subscriptionStatusSchema } from './subscription.schemas';

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
