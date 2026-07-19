import { z } from 'zod';

export const webhookEventSchema = z.object({
  event: z.enum(['payment.succeeded', 'payment.canceled', 'payment.waiting_for_capture']),
  object: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
  }),
});
