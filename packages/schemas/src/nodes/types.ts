import type { z } from 'zod';
import type { nodeSchema, nodeStatusSchema } from './outputs';

export type Node = z.infer<typeof nodeSchema>;
export type NodeStatus = z.infer<typeof nodeStatusSchema>;
