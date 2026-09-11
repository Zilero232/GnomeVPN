import { z } from 'zod';

export const nodeStatusSchema = z.enum(['online', 'degraded', 'offline']);

export const nodeSchema = z.object({
  id: z.uuid(),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1).optional(),
  status: nodeStatusSchema,
  lastHealthyAt: z.string().nullable()
});

export const nodeEndpointSchema = z.object({
  id: z.uuid(),
  host: z.string().min(1),
  port: z.number().int().positive(),
  serverName: z.string().min(1)
});
