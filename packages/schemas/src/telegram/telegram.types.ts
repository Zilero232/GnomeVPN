import type { z } from 'zod';

import type { telegramLinkCodeSchema, telegramStatusSchema } from './telegram.schemas';

export type TelegramLinkCode = z.infer<typeof telegramLinkCodeSchema>;

export type TelegramStatus = z.infer<typeof telegramStatusSchema>;
