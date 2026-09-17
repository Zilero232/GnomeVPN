import { z } from 'zod';

import { PLATFORM_IDS } from './platforms.constants';

export const platformIdSchema = z.enum(PLATFORM_IDS);

export const platformSchema = z.object({
  id: platformIdSchema,
  href: z.url()
});
