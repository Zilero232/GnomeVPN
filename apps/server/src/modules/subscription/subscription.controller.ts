import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators';
import { SubscriptionStatusDto } from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get('status')
  @ZodResponse({ type: SubscriptionStatusDto })
  getStatus(@CurrentUser() userId: string) {
    return this.subscription.getStatus(userId);
  }
}
