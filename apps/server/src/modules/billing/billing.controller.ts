import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { CheckoutResultDto, WebhookEventDto } from './dto/billing.dto';
import { WebhookIpGuard } from './webhook-ip.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @ZodResponse({ type: CheckoutResultDto })
  createCheckout(@CurrentUser() userId: string) {
    return this.billing.createCheckout(userId);
  }

  @Post('cancel')
  @HttpCode(204)
  cancelAutoRenew(@CurrentUser() userId: string) {
    return this.billing.cancelAutoRenew(userId);
  }

  @Public()
  @UseGuards(WebhookIpGuard)
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: WebhookEventDto) {
    await this.billing.handleWebhook(body);

    return { received: true };
  }
}
