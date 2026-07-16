import { z } from 'zod';

export const tunnelConfigSchema = z.object({
  privateKey: z.string().min(1),
  address: z.string().min(1),
  dns: z.string().min(1),
  serverPublicKey: z.string().min(1),
  endpoint: z.string().min(1),
  allowedIps: z.array(z.string().min(1)),
  persistentKeepalive: z.number().int().nonnegative(),
});
