import { z } from 'zod';

import { DEFAULT_TUNNEL_PROTOCOL, TUNNEL_PROTOCOL } from './tunnel.constants';

export const tunnelProtocolSchema = z.enum([TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.vless]);

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
    port: z.number().int().positive(),
    auth: z.string().default(''),
    serverName: z.string().default(''),
    insecure: z.boolean().default(false),
    certFingerprint: z.string().default(''),
    dns: z.array(z.string().min(1)),
    reality: realityConfigSchema.optional()
  })
  .refine(
    (config) => {
      if (config.protocol === TUNNEL_PROTOCOL.vless) {
        return config.reality !== undefined && config.auth.length > 0 && config.serverName.length > 0;
      }

      return config.auth.length > 0 && config.serverName.length > 0;
    },
    { message: 'validation.tunnelProtocolFields' }
  );
