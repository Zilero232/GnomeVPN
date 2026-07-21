import { Module } from '@nestjs/common';

import { AppConfigService } from '../../config/config.module';
import { makeYooKassaClient, YooKassaClient } from '../../lib';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WebhookIpGuard } from './guards';

const yooKassaProvider = {
  provide: YooKassaClient,
  useFactory: (config: AppConfigService) => makeYooKassaClient(config),
  inject: [AppConfigService],
};

@Module({
  controllers: [BillingController],
  providers: [BillingService, WebhookIpGuard, yooKassaProvider],
  exports: [BillingService, YooKassaClient],
})
export class BillingModule {}
