import { Module } from '@nestjs/common';

import { SubscriptionGuard } from './guards';
import { SubscriptionService } from './services';
import { SubscriptionController } from './subscription.controller';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionGuard],
  exports: [SubscriptionService, SubscriptionGuard]
})
export class SubscriptionModule {}
