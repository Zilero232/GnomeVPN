import { telegramLinkCodeSchema, telegramStatusSchema, telegramWebLoginSchema, telegramWidgetSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class TelegramLinkCodeDto extends createZodDto(telegramLinkCodeSchema) {}

export class TelegramStatusDto extends createZodDto(telegramStatusSchema) {}

export class TelegramWebLoginDto extends createZodDto(telegramWebLoginSchema) {}

export class TelegramWidgetDto extends createZodDto(telegramWidgetSchema) {}
