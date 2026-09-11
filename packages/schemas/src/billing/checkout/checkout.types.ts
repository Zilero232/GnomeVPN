import type { z } from 'zod';

import type {
  bindCardResultSchema,
  bindCardSchema,
  buyExtraDevicesSchema,
  checkoutClientSchema,
  checkoutResultSchema,
  createCheckoutSchema
} from './checkout.schemas';

export type CheckoutClient = z.infer<typeof checkoutClientSchema>;

export type CheckoutResult = z.infer<typeof checkoutResultSchema>;

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export type BindCardInput = z.infer<typeof bindCardSchema>;

export type BindCardResult = z.infer<typeof bindCardResultSchema>;

export type BuyExtraDevicesInput = z.infer<typeof buyExtraDevicesSchema>;
