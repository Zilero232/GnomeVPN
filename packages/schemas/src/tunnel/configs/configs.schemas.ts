import { z } from 'zod';

import { DEFAULT_TUNNEL_PROTOCOL, tunnelProtocolSchema } from '../tunnel';

export const issueConfigSchema = z.object({
  nodeId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'validation.nameRequired')
    .max(32, 'validation.nameMax')
    .transform((value) => value.replace(/\s+/g, ' ')),
  protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL)
});

export const revokeConfigSchema = z.object({
  id: z.uuid()
});

export const downloadedConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodeId: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().min(1),
  protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL),
  createdAt: z.string()
});

export const configStatusSchema = z.object({
  onlineIds: z.array(z.string().min(1)),
  brokenIds: z.array(z.string().min(1)).default([])
});
