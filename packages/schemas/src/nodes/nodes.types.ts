import type { z } from 'zod';

import type { nodeEndpointSchema, nodeSchema, nodeStatusSchema } from './nodes.schemas';

export type Node = z.infer<typeof nodeSchema>;
export type NodeEndpoint = z.infer<typeof nodeEndpointSchema>;
export type NodeStatus = z.infer<typeof nodeStatusSchema>;
