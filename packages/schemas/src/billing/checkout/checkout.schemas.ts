import { z } from 'zod';

import { MAX_EXTRA_DEVICES } from '../addons';
import { planIdSchema } from '../plans';

export const createCheckoutSchema = z.object({
  planId: planIdSchema
});

export const buyExtraDevicesSchema = z.object({
  quantity: z.number().int().min(1).max(MAX_EXTRA_DEVICES)
});

export const checkoutResultSchema = z.object({
  confirmationUrl: z.url()
});

export const bindCardResultSchema = z.object({
  confirmationUrl: z.url().nullable(),
  isActive: z.boolean()
});
