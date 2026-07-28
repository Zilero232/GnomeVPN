import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionStatusDto } from './dto/subscription.dto';
import { SubscriptionService } from './services';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get('status')
  @ZodResponse({ type: SubscriptionStatusDto })
  getStatus(@CurrentUserId() userId: string) {
    return this.subscription.getStatus(userId);
  }
}
