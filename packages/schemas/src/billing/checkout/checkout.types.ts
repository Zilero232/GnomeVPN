import type { z } from 'zod';

import type { bindCardResultSchema, buyExtraDevicesSchema, checkoutResultSchema, createCheckoutSchema } from './checkout.schemas';

export type CheckoutResult = z.infer<typeof checkoutResultSchema>;

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export type BindCardResult = z.infer<typeof bindCardResultSchema>;

export type BuyExtraDevicesInput = z.infer<typeof buyExtraDevicesSchema>;
