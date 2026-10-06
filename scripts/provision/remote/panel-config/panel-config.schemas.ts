import { z } from 'zod';

export const panelReplySchema = z.object({
  success: z.boolean(),
  msg: z.string().optional()
});

export const panelSettingsReplySchema = panelReplySchema.extend({
  obj: z.record(z.string(), z.unknown())
});
