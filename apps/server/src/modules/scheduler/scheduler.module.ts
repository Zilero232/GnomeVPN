import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BillingModule } from '../billing';
import { ConfigsModule } from '../configs';
import { SessionsModule } from '../sessions';
import { ExpiredAccessJob, NodeHealthJob, PeerGcJob, RecurringChargeJob } from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, SessionsModule, ConfigsModule],
  providers: [ExpiredAccessJob, NodeHealthJob, PeerGcJob, RecurringChargeJob],
})
export class SchedulerModule {}
