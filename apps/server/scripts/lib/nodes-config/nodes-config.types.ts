import type { z } from 'zod';
import type { nodeConfigSchema } from './nodes-config.schema';

export type NodeConfig = z.infer<typeof nodeConfigSchema>;
