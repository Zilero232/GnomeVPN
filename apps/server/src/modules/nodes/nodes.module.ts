import { Module } from '@nestjs/common';

import { NodesController } from './nodes.controller';
import { NodesService } from './services';

@Module({
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
