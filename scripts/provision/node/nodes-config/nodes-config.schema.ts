import { z } from 'zod';

import { duplicatesOf } from './nodes-config.helpers';

export const nodeConfigSchema = z.object({
  host: z.string().min(1),
  sshUser: z.string().min(1),
  sshPassword: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/, 'must be two uppercase letters'),
  city: z.string().min(1).optional()
});

export const nodesConfigSchema = z.array(nodeConfigSchema).superRefine((nodes, context) => {
  for (const field of ['host', 'countryCode'] as const) {
    for (const value of duplicatesOf(nodes.map((node) => node[field]))) {
      context.addIssue({ code: 'custom', path: [field], message: `${value} appears more than once` });
    }
  }
});
