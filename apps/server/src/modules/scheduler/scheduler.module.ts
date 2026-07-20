import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TunnelModule } from '../tunnel';
import { ExpiredAccessJob, NodeHealthJob, PeerGcJob, RecurringChargeJob } from './jobs';

@Module({
  imports: [ScheduleModule.forRoot(), TunnelModule],
  providers: [ExpiredAccessJob, NodeHealthJob, PeerGcJob, RecurringChargeJob],
})
export class SchedulerModule {}
