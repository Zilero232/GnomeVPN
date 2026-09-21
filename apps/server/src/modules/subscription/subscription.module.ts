import { Module } from '@nestjs/common';

import { SubscriptionGuard } from './guards';
import { SubscriptionService, TrialService } from './services';
import { SubscriptionController } from './subscription.controller';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionGuard, TrialService],
  exports: [SubscriptionService, SubscriptionGuard, TrialService]
})
export class SubscriptionModule {}
