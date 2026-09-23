import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BillingModule } from '../billing';
import { SubscriptionLinkModule } from '../subscription-link';
import { TelegramNotifyModule } from '../telegram/telegram-notify.module';
import { ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob } from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, SubscriptionLinkModule, TelegramNotifyModule],
  providers: [ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob]
})
export class SchedulerModule {}
