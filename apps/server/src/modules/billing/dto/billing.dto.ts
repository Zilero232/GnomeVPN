import { bindCardResultSchema, buyExtraDevicesSchema, checkoutResultSchema, createCheckoutSchema, webhookEventSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class CheckoutResultDto extends createZodDto(checkoutResultSchema) {}

export class CreateCheckoutDto extends createZodDto(createCheckoutSchema) {}

export class WebhookEventDto extends createZodDto(webhookEventSchema) {}

export class BindCardResultDto extends createZodDto(bindCardResultSchema) {}

export class BuyExtraDevicesDto extends createZodDto(buyExtraDevicesSchema) {}
