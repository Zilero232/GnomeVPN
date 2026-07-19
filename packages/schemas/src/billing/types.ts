import type { z } from 'zod';
import type { webhookEventSchema } from './inputs';
import type { checkoutResultSchema } from './outputs';

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type CheckoutResult = z.infer<typeof checkoutResultSchema>;
