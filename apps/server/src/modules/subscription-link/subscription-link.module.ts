import { Module } from '@nestjs/common';

import { PeersModule } from '../peers';
import { SubscriptionAccessService, SubscriptionFeedService, SubscriptionLinkService } from './services';
import { SubscriptionFeedController } from './subscription-feed.controller';
import { SubscriptionLinkController } from './subscription-link.controller';

@Module({
  imports: [PeersModule],
  controllers: [SubscriptionLinkController, SubscriptionFeedController],
  providers: [SubscriptionLinkService, SubscriptionFeedService, SubscriptionAccessService],
  exports: [SubscriptionLinkService, SubscriptionAccessService]
})
export class SubscriptionLinkModule {}
