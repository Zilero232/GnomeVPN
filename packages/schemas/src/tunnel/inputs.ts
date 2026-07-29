import { z } from 'zod';

import { DEFAULT_TUNNEL_PROTOCOL, tunnelProtocolSchema } from './outputs';

export const connectInputSchema = z.object({
  nodeId: z.uuid(),
  deviceId: z.uuid(),
  protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL)
});

export const disconnectInputSchema = z.object({
  deviceId: z.uuid()
});

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
