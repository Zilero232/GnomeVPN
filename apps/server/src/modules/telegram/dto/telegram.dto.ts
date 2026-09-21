import { telegramLinkCodeSchema, telegramStatusSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class TelegramLinkCodeDto extends createZodDto(telegramLinkCodeSchema) {}

export class TelegramStatusDto extends createZodDto(telegramStatusSchema) {}
