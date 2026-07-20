import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators';
import { BillingService } from './billing.service';
import {
  BindCardDto,
  BindCardResultDto,
  CheckoutResultDto,
  CreateCheckoutDto,
  WebhookEventDto,
} from './dto/billing.dto';
import { WebhookIpGuard } from './guards';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @ZodResponse({ type: CheckoutResultDto })
  createCheckout(@Body() body: CreateCheckoutDto, @CurrentUser() userId: string) {
    return this.billing.createCheckout(userId, body.planId, body.client);
  }

  @Post('cancel')
  @HttpCode(204)
  cancelAutoRenew(@CurrentUser() userId: string) {
    return this.billing.cancelAutoRenew(userId);
  }

  @Post('resume')
  @HttpCode(204)
  resumeAutoRenew(@CurrentUser() userId: string) {
    return this.billing.resumeAutoRenew(userId);
  }

  @Post('bind-card')
  @ZodResponse({ type: BindCardResultDto })
  bindCard(@Body() body: BindCardDto, @CurrentUser() userId: string) {
    return this.billing.bindCard(userId, body.client);
  }

  @Post('unbind-card')
  @HttpCode(204)
  unbindCard(@CurrentUser() userId: string) {
    return this.billing.unbindCard(userId);
  }

  @AllowAnonymous()
  @UseGuards(WebhookIpGuard)
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: WebhookEventDto) {
    await this.billing.handleWebhook(body);

    return { received: true };
  }
}
