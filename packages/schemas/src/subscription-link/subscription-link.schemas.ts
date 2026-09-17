import { z } from 'zod';

export const subscriptionLinkSchema = z.object({
  url: z.string(),
  deepLink: z.string(),
  createdAt: z.string()
});
