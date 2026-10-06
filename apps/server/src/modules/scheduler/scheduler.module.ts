import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BillingModule } from '../billing';
import { DevicesModule } from '../devices';
import { SubscriptionLinkModule } from '../subscription-link';
import { TelegramNotifyModule } from '../telegram/telegram-notify.module';
import {
  DeviceSlotsJob,
  ExpiredAccessJob,
  NodeHealthJob,
  PendingPaymentsJob,
  PeriodReminderJob,
  ReconcilePeersJob,
  RecurringChargeJob
} from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, DevicesModule, SubscriptionLinkModule, TelegramNotifyModule],
  providers: [DeviceSlotsJob, ExpiredAccessJob, NodeHealthJob, PendingPaymentsJob, PeriodReminderJob, ReconcilePeersJob, RecurringChargeJob]
})
export class SchedulerModule {}
