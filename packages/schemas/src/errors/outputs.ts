import { z } from 'zod';

import { apiErrorCodeSchema } from './codes';

export const apiErrorSchema = z.object({
  error: z.string(),
  code: apiErrorCodeSchema,
});
