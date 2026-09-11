import type { z } from 'zod';

import type { webhookEventSchema } from './webhook.schemas';

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
