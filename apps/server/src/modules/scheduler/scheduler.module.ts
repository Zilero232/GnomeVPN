import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BillingModule } from '../billing';
import { SubscriptionLinkModule } from '../subscription-link';
import { ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob } from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, SubscriptionLinkModule],
  providers: [ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob]
})
export class SchedulerModule {}
