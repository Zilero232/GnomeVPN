import type { z } from 'zod';

import type { splitConfigSchema, splitModeSchema } from './split.schemas';

export type SplitMode = z.infer<typeof splitModeSchema>;

export type SplitConfig = z.infer<typeof splitConfigSchema>;
