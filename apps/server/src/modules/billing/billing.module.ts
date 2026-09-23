import { Module } from '@nestjs/common';

import { AppConfigService } from '../../config';
import { makeYooKassaClient, YooKassaClient } from '../../lib';
import { SubscriptionLinkModule } from '../subscription-link';
import { TelegramNotifyModule } from '../telegram/telegram-notify.module';
import { BillingController } from './billing.controller';
import { WebhookIpGuard } from './guards';
import { AutoRenewService, BillingSharedService, CardService, CheckoutService, WebhookService } from './services';

const yooKassaProvider = {
  provide: YooKassaClient,
  useFactory: (config: AppConfigService) => makeYooKassaClient(config),
  inject: [AppConfigService]
};

@Module({
  imports: [SubscriptionLinkModule, TelegramNotifyModule],
  controllers: [BillingController],
  providers: [BillingSharedService, CheckoutService, WebhookService, AutoRenewService, CardService, WebhookIpGuard, yooKassaProvider],
  exports: [AutoRenewService, CheckoutService, WebhookService, YooKassaClient]
})
export class BillingModule {}
