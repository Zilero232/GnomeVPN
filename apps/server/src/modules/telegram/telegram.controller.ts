import type { Update } from 'grammy/types';

import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { isNullish } from 'remeda';

import { timingSafeEqual } from '../../common/lib';
import { AppConfigService } from '../../config';
import { WEBHOOK } from './config';
import { TelegramBotService } from './services';

@Controller(WEBHOOK.path)
export class TelegramController {
  constructor(
    private readonly bot: TelegramBotService,
    private readonly config: AppConfigService
  ) {}

  @AllowAnonymous()
  @SkipThrottle()
  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(@Body() update: Update, @Headers(WEBHOOK.secretHeader) secret: string | undefined): Promise<void> {
    if (!this.isFromTelegram(secret)) {
      return;
    }

    await this.bot.handleUpdate(update);
  }

  private isFromTelegram(secret: string | undefined): boolean {
    const expected = this.config.get('TELEGRAM_WEBHOOK_SECRET');

    if (!expected || isNullish(secret)) {
      return false;
    }

    return timingSafeEqual({ actual: secret, expected });
  }
}
