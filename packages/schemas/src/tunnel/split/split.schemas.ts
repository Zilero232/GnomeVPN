import { z } from 'zod';

import { SPLIT_MODE } from './split.constants';

export const splitModeSchema = z.enum([SPLIT_MODE.allowed, SPLIT_MODE.disallowed]);

export const splitConfigSchema = z.object({
  appsMode: splitModeSchema,
  apps: z.array(z.string().min(1)),
  ipsMode: splitModeSchema,
  ips: z.array(z.string().min(1))
});
