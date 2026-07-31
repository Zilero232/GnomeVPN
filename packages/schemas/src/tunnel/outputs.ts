import { z } from 'zod';

export const TUNNEL_PROTOCOL = {
  hysteria2: 'hysteria2',
  wireguard: 'wireguard'
} as const;

export const DEFAULT_TUNNEL_PROTOCOL = TUNNEL_PROTOCOL.hysteria2;

export const tunnelProtocolSchema = z.enum([TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.wireguard]);

export const wireguardConfigSchema = z.object({
  privateKey: z.string().min(1),
  address: z.string().min(1),
  peerPublicKey: z.string().min(1),
  allowedIps: z.array(z.string().min(1)).default(['0.0.0.0/0']),
  reserved: z.array(z.number().int()).default([]),
  mtu: z.number().int().positive().optional()
});

export const portRangeSchema = z
  .object({
    from: z.number().int().min(1).max(65_535),
    to: z.number().int().min(1).max(65_535)
  })
  .refine((range) => range.from < range.to, { message: 'validation.portRangeOrder' });

export const tunnelConfigSchema = z
  .object({
    protocol: tunnelProtocolSchema.default(DEFAULT_TUNNEL_PROTOCOL),
    server: z.string().min(1),
    port: z.number().int().positive(),
    portRange: portRangeSchema.optional(),
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

export const SPLIT_MODE = {
  allowed: 'allowed',
  disallowed: 'disallowed'
} as const;

export const splitModeSchema = z.enum([SPLIT_MODE.allowed, SPLIT_MODE.disallowed]);

export const splitConfigSchema = z.object({
  appsMode: splitModeSchema,
  apps: z.array(z.string().min(1)),
  ipsMode: splitModeSchema,
  ips: z.array(z.string().min(1))
});

export const deviceSlotSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  isOnline: z.boolean(),
  isCurrent: z.boolean()
});

export const deviceUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  devices: z.array(deviceSlotSchema)
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
