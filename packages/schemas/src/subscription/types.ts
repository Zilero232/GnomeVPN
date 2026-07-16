import type { z } from 'zod';
import type { subscriptionStatusSchema } from './outputs';

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
