import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { BillingModule } from '../billing';
import { SubscriptionModule } from '../subscription';
import { SubscriptionLinkModule } from '../subscription-link';
import {
  TelegramAccountService,
  TelegramAppsService,
  TelegramBillingService,
  TelegramBotService,
  TelegramLinkService,
  TelegramProfileService,
  TelegramSharedService,
  TelegramSubscriptionService,
  TelegramWebLoginService
} from './services';
import { TelegramLinkController } from './telegram-link.controller';
import { TelegramWebLoginController } from './telegram-web-login.controller';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [AuthModule, BillingModule, SubscriptionModule, SubscriptionLinkModule],
  controllers: [TelegramController, TelegramLinkController, TelegramWebLoginController],
  providers: [
    TelegramAccountService,
    TelegramAppsService,
    TelegramBillingService,
    TelegramBotService,
    TelegramLinkService,
    TelegramProfileService,
    TelegramSharedService,
    TelegramSubscriptionService,
    TelegramWebLoginService
  ],
  exports: [TelegramLinkService]
})
export class TelegramModule {}
