import { Module } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionService } from './subscription.service';

@Module({
  providers: [SubscriptionService, SubscriptionGuard],
  exports: [SubscriptionService, SubscriptionGuard],
})
export class SubscriptionModule {}
