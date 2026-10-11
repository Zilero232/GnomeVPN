import type { z } from 'zod';

import type { periodKindSchema, subscriptionStatusSchema } from './subscription.schemas';

export type PeriodKind = z.infer<typeof periodKindSchema>;

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
