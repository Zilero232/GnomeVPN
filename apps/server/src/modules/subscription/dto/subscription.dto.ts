import { subscriptionStatusSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class SubscriptionStatusDto extends createZodDto(subscriptionStatusSchema) {}
