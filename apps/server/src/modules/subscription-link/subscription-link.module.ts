import { Module } from '@nestjs/common';

import { DevicesModule } from '../devices';
import { PeersModule } from '../peers';
import { TelegramNotifyModule } from '../telegram/telegram-notify.module';
import { FeedNoticeService, SubscriptionAccessService, SubscriptionFeedService, SubscriptionLinkService, SubscriptionPeersService } from './services';
import { SubscriptionFeedController } from './subscription-feed.controller';
import { SubscriptionLinkController } from './subscription-link.controller';

@Module({
  imports: [DevicesModule, PeersModule, TelegramNotifyModule],
  controllers: [SubscriptionLinkController, SubscriptionFeedController],
  providers: [FeedNoticeService, SubscriptionLinkService, SubscriptionFeedService, SubscriptionPeersService, SubscriptionAccessService],
  exports: [SubscriptionLinkService, SubscriptionAccessService]
})
export class SubscriptionLinkModule {}
