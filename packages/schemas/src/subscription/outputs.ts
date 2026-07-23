import { z } from 'zod';

import { limitsSchema } from '../billing/outputs';
import { planIdSchema } from '../billing/plans';

export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'expired']),
  plan: planIdSchema,
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasPaymentMethod: z.boolean(),
  savedCardTitle: z.string().nullable(),
  isRecurringAvailable: z.boolean(),
  limits: limitsSchema,
});
