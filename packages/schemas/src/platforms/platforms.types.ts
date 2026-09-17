import type { z } from 'zod';

import type { platformIdSchema, platformSchema } from './platforms.schemas';

export type PlatformId = z.infer<typeof platformIdSchema>;

export type Platform = z.infer<typeof platformSchema>;
