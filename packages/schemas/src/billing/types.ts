import type { z } from 'zod';

import type {
  bindCardSchema,
  buyExtraDevicesSchema,
  checkoutClientSchema,
  createCheckoutSchema,
  webhookEventSchema
} from './inputs';
import type { bindCardResultSchema, checkoutResultSchema, limitsSchema } from './outputs';
import type { planIdSchema, planSchema } from './plans';

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type CheckoutResult = z.infer<typeof checkoutResultSchema>;
export type BindCardResult = z.infer<typeof bindCardResultSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type BindCardInput = z.infer<typeof bindCardSchema>;
export type CheckoutClient = z.infer<typeof checkoutClientSchema>;
export type PlanId = z.infer<typeof planIdSchema>;
export type Plan = z.infer<typeof planSchema>;
export type BuyExtraDevicesInput = z.infer<typeof buyExtraDevicesSchema>;
export type Limits = z.infer<typeof limitsSchema>;
