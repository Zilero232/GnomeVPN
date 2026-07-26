import { z } from 'zod';

export const tunnelConfigSchema = z.object({
  server: z.string().min(1),
  port: z.number().int().positive(),
  auth: z.string().min(1),
  serverName: z.string().min(1),
  insecure: z.boolean().default(false),
  dns: z.array(z.string().min(1)),
});

export const SPLIT_MODE = {
  allowed: 'allowed',
  disallowed: 'disallowed',
} as const;

export const splitModeSchema = z.enum([SPLIT_MODE.allowed, SPLIT_MODE.disallowed]);

export const splitConfigSchema = z.object({
  appsMode: splitModeSchema,
  apps: z.array(z.string().min(1)),
  ipsMode: splitModeSchema,
  ips: z.array(z.string().min(1)),
});

export const deviceSlotSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  lastActiveAt: z.string().nullable(),
  isCurrent: z.boolean(),
});

export const deviceUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  devices: z.array(deviceSlotSchema),
});

export const downloadedConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodeId: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().min(1),
  createdAt: z.string(),
});
