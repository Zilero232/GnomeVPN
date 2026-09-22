import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { AnsweredInput, AttemptInput, BotContext, BotText, ChatState, ReplyInput, WithUserInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { SubscriptionService, TrialService } from '../../subscription';
import { BOT_TEXT, DEFAULT_BOT_LOCALE } from '../config';
import { identityOf, mainKeyboard, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramSharedService {
  private readonly logger = new Logger(TelegramSharedService.name);

  constructor(
    private readonly link: TelegramLinkService,
    private readonly subscription: SubscriptionService,
    private readonly trial: TrialService
  ) {}

  textFor(ctx: BotContext): BotText {
    return BOT_TEXT[resolveLocale(ctx.from?.language_code) ?? DEFAULT_BOT_LOCALE];
  }

  async reply({ ctx, text, chat }: ReplyInput): Promise<void> {
    if (isNullish(chat)) {
      await ctx.reply(text);

      return;
    }

    const state = await this.stateOf(chat.userId);

    await ctx.reply(text, { reply_markup: mainKeyboard({ locale: chat.locale, state }) });
  }

  async stateOf(userId: string): Promise<ChatState> {
    const [isSubscribed, eligibility] = await Promise.all([this.subscription.hasActiveAccess(userId), this.trial.eligibility(userId)]);

    return { isSubscribed, isTrialAvailable: eligibility === 'available' };
  }

  async answered({ ctx, prefix, act }: AnsweredInput): Promise<void> {
    const identity = identityOf(ctx.from);
    const data = ctx.callbackQuery?.data;

    if (isNullish(identity) || isNullish(data)) {
      return;
    }

    await ctx.answerCallbackQuery();

    const chat = await this.link.ensureChat(identity);

    await this.attempt({ ctx, chat, act: () => act({ chat, value: data.slice(prefix.length) }) });
  }

  async withUser({ ctx, act }: WithUserInput): Promise<void> {
    const identity = identityOf(ctx.from);

    if (isNullish(identity)) {
      return;
    }

    const chat = await this.link.ensureChat(identity);

    void this.link.touch(identity);

    await this.attempt({ ctx, chat, act: () => act(chat) });
  }

  private async attempt({ ctx, chat, act }: AttemptInput): Promise<void> {
    try {
      await act();
    } catch (error) {
      this.logger.warn(`telegram handler failed: ${describeError(error)}`);

      await ctx.reply(BOT_TEXT[chat.locale].failed);
    }
  }
}
