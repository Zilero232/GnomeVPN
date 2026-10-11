import { z } from 'zod';

import { limitsSchema } from '../billing/addons';
import { planIdSchema } from '../billing/plans';

export const periodKindSchema = z.enum(['none', 'trial', 'paid']);

export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'expired']),
  plan: planIdSchema,
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasPaymentMethod: z.boolean(),
  savedCardTitle: z.string().nullable(),
  isRecurringAvailable: z.boolean(),
  period: periodKindSchema,
  isTrialAvailable: z.boolean(),
  limits: limitsSchema
});
