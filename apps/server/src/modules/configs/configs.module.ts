import { Module } from '@nestjs/common';

import { NodesModule } from '../nodes';
import { PeersModule } from '../peers';
import { SubscriptionModule } from '../subscription';
import { ConfigsController } from './configs.controller';
import { ConfigAccessService, ConfigIssueService } from './services';

@Module({
  imports: [NodesModule, PeersModule, SubscriptionModule],
  controllers: [ConfigsController],
  providers: [ConfigIssueService, ConfigAccessService],
  exports: [ConfigAccessService]
})
export class ConfigsModule {}
