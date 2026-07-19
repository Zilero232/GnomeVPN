import { checkoutResultSchema, webhookEventSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class CheckoutResultDto extends createZodDto(checkoutResultSchema) {}

export class WebhookEventDto extends createZodDto(webhookEventSchema) {}
