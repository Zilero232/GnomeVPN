import { z } from 'zod';

export const telegramLinkCodeSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
  botUsername: z.string()
});

export const telegramStatusSchema = z.object({
  isLinked: z.boolean(),
  username: z.string().nullable(),
  botUsername: z.string()
});

export const telegramWebLoginSchema = z.object({
  token: z.string()
});

export const telegramWidgetSchema = z.object({
  botUsername: z.string()
});
