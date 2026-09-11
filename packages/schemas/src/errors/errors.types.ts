import type { z } from 'zod';

import type { apiErrorCodeSchema } from './errors.constants';
import type { apiErrorSchema } from './errors.schemas';

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
