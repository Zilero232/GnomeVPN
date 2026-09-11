import type { z } from 'zod';

import type { limitsSchema } from './addons.schemas';

export type Limits = z.infer<typeof limitsSchema>;
