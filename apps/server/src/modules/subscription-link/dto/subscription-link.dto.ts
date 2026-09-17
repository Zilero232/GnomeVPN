import { subscriptionLinkSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class SubscriptionLinkDto extends createZodDto(subscriptionLinkSchema) {}
