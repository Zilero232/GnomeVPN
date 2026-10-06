import { z } from 'zod';

import { DEFAULT_TUNNEL_PROTOCOL, MAX_PORT, TUNNEL_PROTOCOL } from './tunnel.constants';

export const tunnelProtocolSchema = z.enum(TUNNEL_PROTOCOL);

export const realityConfigSchema = z.object({
  publicKey: z.string().min(1),
  shortId: z.string().min(1),
  fingerprint: z.string().min(1),
  flow: z.string().default(''),
  serviceName: z.string().default('')
});

export const tunnelConfigSchema = z
  .object({
    protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL),
    server: z.string().min(1),
    port: z.number().int().positive().max(MAX_PORT),
    auth: z.string().default(''),
    serverName: z.string().default(''),
    insecure: z.boolean().default(false),
    certFingerprint: z.string().default(''),
    dns: z.array(z.string().min(1)),
    reality: realityConfigSchema.optional()
  })
  .refine(
    (config) => config.auth.length > 0 && config.serverName.length > 0 && (config.protocol !== TUNNEL_PROTOCOL.vless || config.reality !== undefined),
    { message: 'a tunnel config needs auth and serverName, and a vless one needs reality' }
  );
