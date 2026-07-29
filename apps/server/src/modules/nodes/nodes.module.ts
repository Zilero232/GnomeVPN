import { Module } from '@nestjs/common';

import { SubscriptionModule } from '../subscription';
import { NodesController } from './nodes.controller';
import { NodesService } from './services';

@Module({
  imports: [SubscriptionModule],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService]
})
export class NodesModule {}
