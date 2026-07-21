import { Module } from '@nestjs/common';

import { NodesModule } from '../nodes';
import { PeersModule } from '../peers';
import { SubscriptionModule } from '../subscription';
import { ConfigsController } from './configs.controller';
import { ConfigsService } from './configs.service';

@Module({
  imports: [NodesModule, PeersModule, SubscriptionModule],
  controllers: [ConfigsController],
  providers: [ConfigsService],
  exports: [ConfigsService],
})
export class ConfigsModule {}
