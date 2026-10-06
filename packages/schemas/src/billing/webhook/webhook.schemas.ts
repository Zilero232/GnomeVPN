import { z } from 'zod';

export const webhookEventSchema = z.object({
  event: z.string().min(1),
  object: z.object({
    id: z.string().min(1),
    status: z.string().min(1).optional()
  })
});
