import type { z } from 'zod';

import type { planIdSchema, planSchema } from './plans.schemas';

export type PlanId = z.infer<typeof planIdSchema>;

export type Plan = z.infer<typeof planSchema>;
