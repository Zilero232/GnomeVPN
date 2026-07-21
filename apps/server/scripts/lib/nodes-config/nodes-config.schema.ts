import { z } from 'zod';

export const nodeConfigSchema = z.object({
  host: z.string().min(1),
  sshUser: z.string().min(1),
  sshPassword: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1).optional(),
  realityServerName: z.string().min(1).default('www.microsoft.com'),
});

export const nodesConfigSchema = z.array(nodeConfigSchema);
