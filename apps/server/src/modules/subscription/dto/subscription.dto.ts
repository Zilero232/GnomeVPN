import { subscriptionStatusSchema } from '@vesper/schemas';
import { createZodDto } from 'nestjs-zod';

export class SubscriptionStatusDto extends createZodDto(subscriptionStatusSchema) {}
