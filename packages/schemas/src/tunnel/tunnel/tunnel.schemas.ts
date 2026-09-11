import { z } from 'zod';

import { DEFAULT_TUNNEL_PROTOCOL, TUNNEL_PROTOCOL } from './tunnel.constants';

export const tunnelProtocolSchema = z.enum([TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.wireguard]);

export const wireguardConfigSchema = z.object({
  privateKey: z.string().min(1),
  address: z.string().min(1),
  peerPublicKey: z.string().min(1),
  allowedIps: z.array(z.string().min(1)).default(['0.0.0.0/0']),
  reserved: z.array(z.number().int()).default([]),
  mtu: z.number().int().positive().optional()
});

export const tunnelConfigSchema = z
  .object({
    protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL),
    server: z.string().min(1),
    port: z.number().int().positive(),
    auth: z.string().default(''),
    serverName: z.string().default(''),
    insecure: z.boolean().default(false),
    dns: z.array(z.string().min(1)),
    wireguard: wireguardConfigSchema.optional()
  })
  .refine(
    (config) =>
      config.protocol === TUNNEL_PROTOCOL.wireguard ? config.wireguard !== undefined : config.auth.length > 0 && config.serverName.length > 0,
    { message: 'validation.tunnelProtocolFields' }
  );

export const connectInputSchema = z.object({
  nodeId: z.uuid(),
  deviceId: z.uuid(),
  protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL)
});

export const disconnectInputSchema = z.object({
  deviceId: z.uuid()
});
