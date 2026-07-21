import { z } from 'zod';

export const tunnelConfigSchema = z.object({
  server: z.string().min(1),
  port: z.number().int().positive(),
  userId: z.uuid(),
  serverName: z.string().min(1),
  publicKey: z.string().min(1),
  shortId: z.string().nullable().default(null),
  fingerprint: z.string().min(1),
  dns: z.array(z.string().min(1)),
});

export const downloadedConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodeId: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().min(1),
  createdAt: z.string(),
});
