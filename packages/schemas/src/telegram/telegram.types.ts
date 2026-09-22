import type { z } from 'zod';

import type { telegramLinkCodeSchema, telegramStatusSchema, telegramWebLoginSchema, telegramWidgetSchema } from './telegram.schemas';

export type TelegramLinkCode = z.infer<typeof telegramLinkCodeSchema>;

export type TelegramStatus = z.infer<typeof telegramStatusSchema>;

export type TelegramWebLogin = z.infer<typeof telegramWebLoginSchema>;

export type TelegramWidget = z.infer<typeof telegramWidgetSchema>;
