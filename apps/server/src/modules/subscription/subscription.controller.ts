import { Controller, Get } from '@nestjs/common';
import { subscriptionStatusSchema } from '@vesper/schemas';
import { createZodDto, ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

class SubscriptionStatusDto extends createZodDto(subscriptionStatusSchema) {}

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get('status')
  @ZodResponse({ type: SubscriptionStatusDto })
  getStatus(@CurrentUser() userId: string) {
    return this.subscription.getStatus(userId);
  }
}
