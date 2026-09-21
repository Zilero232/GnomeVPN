import { Module } from '@nestjs/common';

import { BillingModule } from '../billing';
import { SubscriptionModule } from '../subscription';
import { SubscriptionLinkModule } from '../subscription-link';
import {
  TelegramAccountService,
  TelegramBotService,
  TelegramLinkService,
  TelegramProfileService,
  TelegramSharedService,
  TelegramSubscriptionService
} from './services';
import { TelegramLinkController } from './telegram-link.controller';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [BillingModule, SubscriptionModule, SubscriptionLinkModule],
  controllers: [TelegramController, TelegramLinkController],
  providers: [
    TelegramAccountService,
    TelegramBotService,
    TelegramLinkService,
    TelegramProfileService,
    TelegramSharedService,
    TelegramSubscriptionService
  ],
  exports: [TelegramLinkService]
})
export class TelegramModule {}
