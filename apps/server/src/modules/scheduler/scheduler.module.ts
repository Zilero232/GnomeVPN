import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PeerGcJob } from './peer-gc.job';
import { RecurringChargeJob } from './recurring-charge.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PeerGcJob, RecurringChargeJob],
})
export class SchedulerModule {}
