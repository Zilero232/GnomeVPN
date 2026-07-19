import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TunnelModule } from '../tunnel/tunnel.module';
import { ExpiredAccessJob } from './expired-access.job';
import { NodeHealthJob } from './node-health.job';
import { PeerGcJob } from './peer-gc.job';
import { RecurringChargeJob } from './recurring-charge.job';

@Module({
  imports: [ScheduleModule.forRoot(), TunnelModule],
  providers: [ExpiredAccessJob, NodeHealthJob, PeerGcJob, RecurringChargeJob],
})
export class SchedulerModule {}
