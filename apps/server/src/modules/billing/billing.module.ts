import { Module } from '@nestjs/common';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WebhookIpGuard } from './guards';

@Module({
  controllers: [BillingController],
  providers: [BillingService, WebhookIpGuard],
  exports: [BillingService],
})
export class BillingModule {}
