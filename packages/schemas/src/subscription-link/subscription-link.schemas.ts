import { z } from 'zod';

import { clientLinkSchema } from '../clients';

export const subscriptionLinkSchema = z.object({
  url: z.string(),
  deepLink: z.string(),
  clients: z.array(clientLinkSchema),
  createdAt: z.string()
});
