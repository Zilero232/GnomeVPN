import { z } from 'zod';

import { apiErrorCodeSchema } from './errors.constants';

export const apiErrorSchema = z.object({
  error: z.string(),
  code: apiErrorCodeSchema.catch('INTERNAL_ERROR')
});
