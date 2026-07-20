import { Module } from '@nestjs/common';

import { NodesModule } from '../nodes';
import { SubscriptionModule } from '../subscription';
import { ConfigController } from './config.controller';
import { TunnelController } from './tunnel.controller';
import { TunnelService } from './tunnel.service';

@Module({
  imports: [NodesModule, SubscriptionModule],
  controllers: [TunnelController, ConfigController],
  providers: [TunnelService],
  exports: [TunnelService],
})
export class TunnelModule {}
