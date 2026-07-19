import { z } from 'zod';

export const checkoutResultSchema = z.object({
  confirmationUrl: z.url(),
});
