import type { InlineKeyboard, Keyboard } from 'grammy';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { isNullish } from 'remeda';

import type { ChatState } from '../lib';
import type { MarkupForInput, NoticeSpec, NotifyInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { TrialService } from '../../subscription';
import { TELEGRAM_BOT } from '../bot';
import { BOT_TEXT, NOTICES } from '../config';
import { fillText, formatDate, mainKeyboard, menuButtons, resolveLocale } from '../lib';

@Injectable()
export class TelegramNotifyService {
  private readonly logger = new Logger(TelegramNotifyService.name);

  constructor(
    @Inject(TELEGRAM_BOT) private readonly bot: Bot | null,
    private readonly prisma: PrismaService,
    private readonly trial: TrialService
  ) {}

  async tell({ userId, notice, fill, date }: NotifyInput): Promise<void> {
    if (isNullish(this.bot)) {
      return;
    }

    try {
      const chat = await this.prisma.telegramAccount.findUnique({
        where: { userId },
        select: { telegramId: true, locale: true, languageCode: true }
      });

      if (isNullish(chat)) {
        return;
      }

      const locale = resolveLocale(chat.locale ?? chat.languageCode);
      const spec: NoticeSpec = NOTICES[notice];
      const tokens = { ...fill, ...(date && { date: formatDate({ iso: date.toISOString(), locale }) }) };

      await this.bot.api.sendMessage(Number(chat.telegramId), fillText({ text: BOT_TEXT[locale][notice], fill: tokens }), {
        reply_markup: await this.markupFor({ userId, locale, markup: spec.markup }),
        message_effect_id: spec.effect
      });
    } catch (error) {
      this.logger.warn(`could not tell ${userId} in telegram: ${describeError(error)}`);
    }
  }

  async stateOf(userId: string): Promise<ChatState> {
    const { eligibility, hasAccess } = await this.trial.standing(userId);

    return { isSubscribed: hasAccess, isTrialAvailable: eligibility === 'available' };
  }

  private async markupFor({ userId, locale, markup }: MarkupForInput): Promise<InlineKeyboard | Keyboard> {
    if (markup === 'main') {
      return mainKeyboard({ locale, state: await this.stateOf(userId) });
    }

    return menuButtons({ locale, keys: markup });
  }
}
