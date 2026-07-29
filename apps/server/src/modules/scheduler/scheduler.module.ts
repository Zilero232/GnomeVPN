import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BillingModule } from '../billing';
import { ConfigsModule } from '../configs';
import { EventsModule } from '../events';
import { SessionsModule } from '../sessions';
import { ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob } from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, SessionsModule, ConfigsModule, EventsModule],
  providers: [ExpiredAccessJob, NodeHealthJob, ReconcilePeersJob, RecurringChargeJob]
})
export class SchedulerModule {}
