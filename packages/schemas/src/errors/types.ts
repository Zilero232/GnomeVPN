import type { z } from 'zod';

import type { apiErrorCodeSchema } from './codes';
import type { apiErrorSchema } from './outputs';

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
