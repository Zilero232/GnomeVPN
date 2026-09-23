import { Inject, Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { isNullish } from 'remeda';

import type { NotifyInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { SubscriptionService, TrialService } from '../../subscription';
import { TELEGRAM_BOT } from '../bot';
import { BOT_TEXT } from '../config';
import { fillText, formatDate, mainKeyboard, resolveLocale } from '../lib';

@Injectable()
export class TelegramNotifyService {
  private readonly logger = new Logger(TelegramNotifyService.name);

  constructor(
    @Inject(TELEGRAM_BOT) private readonly bot: Bot | null,
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService,
    private readonly trial: TrialService
  ) {}

  async tell({ userId, pick, fill, date }: NotifyInput): Promise<void> {
    if (isNullish(this.bot)) {
      return;
    }

    const chat = await this.prisma.telegramAccount.findUnique({
      where: { userId },
      select: { telegramId: true, locale: true, languageCode: true }
    });

    if (isNullish(chat)) {
      return;
    }

    const locale = resolveLocale(chat.locale ?? chat.languageCode);

    try {
      const [isSubscribed, eligibility] = await Promise.all([this.subscription.hasActiveAccess(userId), this.trial.eligibility(userId)]);
      const state = { isSubscribed, isTrialAvailable: eligibility === 'available' };

      const tokens = { ...fill, ...(date && { date: formatDate({ iso: date.toISOString(), locale }) }) };
      const text = fillText({ text: pick(BOT_TEXT[locale]), fill: tokens });

      await this.bot.api.sendMessage(Number(chat.telegramId), text, { reply_markup: mainKeyboard({ locale, state }) });
    } catch (error) {
      this.logger.warn(`could not tell ${userId} in telegram: ${describeError(error)}`);
    }
  }
}
