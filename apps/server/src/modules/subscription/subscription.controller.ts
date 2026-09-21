import { Controller, Get, Post } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionStatusDto } from './dto/subscription.dto';
import { SubscriptionService, TrialService } from './services';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscription: SubscriptionService,
    private readonly trial: TrialService
  ) {}

  @Get('status')
  @ZodResponse({ type: SubscriptionStatusDto })
  getStatus(@CurrentUserId() userId: string) {
    return this.subscription.getStatus(userId);
  }

  @Post('trial')
  @ZodResponse({ type: SubscriptionStatusDto })
  claimTrial(@CurrentUserId() userId: string) {
    return this.trial.claim(userId);
  }
}
