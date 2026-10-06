import { z } from 'zod';

export const deviceSchema = z.object({
  id: z.string(),
  model: z.string().nullable(),
  platform: z.string().nullable(),
  osVersion: z.string().nullable(),
  app: z.string().nullable(),
  isIdentified: z.boolean(),
  isOverLimit: z.boolean(),
  createdAt: z.string(),
  lastSeenAt: z.string()
});

export const deviceListSchema = z.object({
  devices: z.array(deviceSchema),
  deviceLimit: z.number().int().nonnegative()
});

export const deviceIdParamSchema = z.object({
  id: z.uuid()
});
