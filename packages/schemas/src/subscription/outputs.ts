import { z } from 'zod';

export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'expired', 'canceled']),
  currentPeriodEnd: z.string().nullable(),
});
