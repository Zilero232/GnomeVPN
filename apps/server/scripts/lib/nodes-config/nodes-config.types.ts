import type { z } from 'zod';
import type { nodeConfigSchema, nodesConfigSchema } from './nodes-config.schema';

export type NodeConfig = z.infer<typeof nodeConfigSchema>;

export type NodeConfigIssues = z.ZodError<z.infer<typeof nodesConfigSchema>>['issues'];
