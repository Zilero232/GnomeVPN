import type { z } from 'zod';
import type { nodeSchema } from './outputs';

export type Node = z.infer<typeof nodeSchema>;
