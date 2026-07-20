import { z } from 'zod';

import { planIdSchema } from './plans';

export const webhookEventSchema = z.object({
  event: z.enum([
    'payment.succeeded',
    'payment.canceled',
    'payment.waiting_for_capture',
    'payment_method.active',
  ]),
  object: z.object({
    id: z.string().min(1),
    status: z.string().min(1).optional(),
  }),
});

export const checkoutClientSchema = z.enum(['web', 'desktop']);

export const createCheckoutSchema = z.object({
  planId: planIdSchema,
  client: checkoutClientSchema.default('web'),
});

export const bindCardSchema = z.object({
  client: checkoutClientSchema.default('web'),
});
