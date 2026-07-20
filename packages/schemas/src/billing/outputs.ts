import { z } from 'zod';

export const checkoutResultSchema = z.object({
  confirmationUrl: z.url(),
});

export const bindCardResultSchema = z.object({
  confirmationUrl: z.url().nullable(),
  isActive: z.boolean(),
});
