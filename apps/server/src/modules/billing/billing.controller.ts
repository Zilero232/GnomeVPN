import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import {
  BindCardDto,
  BindCardResultDto,
  BuyExtraDevicesDto,
  CheckoutResultDto,
  CreateCheckoutDto,
  WebhookEventDto,
} from './dto/billing.dto';
import { WebhookIpGuard } from './guards';
import { AutoRenewService, CardService, CheckoutService, WebhookService } from './services';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly autoRenew: AutoRenewService,
    private readonly card: CardService,
    private readonly webhook: WebhookService,
  ) {}

  @Post('checkout')
  @ZodResponse({ type: CheckoutResultDto })
  createCheckout(@Body() body: CreateCheckoutDto, @CurrentUserId() userId: string) {
    return this.checkout.createCheckout(userId, body.planId, body.client);
  }

  @Post('extra-devices')
  @ZodResponse({ type: CheckoutResultDto })
  buyExtraDevices(@Body() body: BuyExtraDevicesDto, @CurrentUserId() userId: string) {
    return this.checkout.buyExtraDevices({ userId, quantity: body.quantity, client: body.client });
  }

  @Post('cancel')
  @HttpCode(204)
  cancelAutoRenew(@CurrentUserId() userId: string) {
    return this.autoRenew.cancelAutoRenew(userId);
  }

  @Post('resume')
  @HttpCode(204)
  resumeAutoRenew(@CurrentUserId() userId: string) {
    return this.autoRenew.resumeAutoRenew(userId);
  }

  @Post('bind-card')
  @ZodResponse({ type: BindCardResultDto })
  bindCard(@Body() body: BindCardDto, @CurrentUserId() userId: string) {
    return this.card.bindCard(userId, body.client);
  }

  @Post('unbind-card')
  @HttpCode(204)
  unbindCard(@CurrentUserId() userId: string) {
    return this.card.unbindCard(userId);
  }

  @AllowAnonymous()
  @UseGuards(WebhookIpGuard)
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: WebhookEventDto) {
    await this.webhook.handleWebhook(body);

    return { received: true };
  }
}
