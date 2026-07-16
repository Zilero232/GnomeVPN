import { z } from 'zod';

export const connectInputSchema = z.object({
  nodeId: z.uuid(),
});
