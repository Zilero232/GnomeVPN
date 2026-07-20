import { z } from 'zod';

export const nodeStatusSchema = z.enum(['online', 'degraded', 'offline']);

export const nodeSchema = z.object({
  id: z.uuid(),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1).optional(),
  status: nodeStatusSchema,
  lastHealthyAt: z.string().nullable(),
});
