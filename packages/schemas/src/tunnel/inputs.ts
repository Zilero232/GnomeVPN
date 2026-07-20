import { z } from 'zod';

export const connectInputSchema = z.object({
  nodeId: z.uuid(),
});

export const issueConfigSchema = z.object({
  nodeId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'validation.nameRequired')
    .max(32, 'validation.nameMax')
    .transform((value) => value.replace(/\s+/g, ' ')),
});

export const revokeConfigSchema = z.object({
  id: z.uuid(),
});
