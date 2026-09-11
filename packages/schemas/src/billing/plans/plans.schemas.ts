import { z } from 'zod';

export const planIdSchema = z.enum(['monthly', 'halfYearly', 'yearly']);

export const planSchema = z.object({
  id: planIdSchema,
  months: z.number().int().positive(),
  priceRub: z.number().int().positive()
});
