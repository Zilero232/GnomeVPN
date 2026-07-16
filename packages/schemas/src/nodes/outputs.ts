import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.uuid(),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  flagEmoji: z.string().min(1),
  city: z.string().min(1).optional(),
});
