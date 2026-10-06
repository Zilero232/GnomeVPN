import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';

import type { AnsweredInput, AskInput, AttemptInput, BotContext, BotText, ConfirmedInput, ReplyInput, WithUserInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { BOT_TEXT, CONFIRMED, DECLINED } from '../config';
import { identityOf, isConfirmed, mainKeyboard, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramNotifyService } from './telegram-notify.service';

@Injectable()
export class TelegramSharedService {
  private readonly logger = new Logger(TelegramSharedService.name);

  constructor(
    private readonly link: TelegramLinkService,
    private readonly notify: TelegramNotifyService
  ) {}

  textFor(ctx: BotContext): BotText {
    return BOT_TEXT[resolveLocale(ctx.from?.language_code)];
  }

  async reply({ ctx, text, chat }: ReplyInput): Promise<void> {
    if (isNullish(chat)) {
      await ctx.reply(text);

      return;
    }

    const state = await this.notify.stateOf(chat.userId);

    await ctx.reply(text, { reply_markup: mainKeyboard({ locale: chat.locale, state }) });
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

  async ask({ ctx, prefix, pick }: AskInput): Promise<void> {
    await this.withUser({
      ctx,
      act: ({ locale }) => {
        const { ask, yes, no } = pick(BOT_TEXT[locale]);
        const keyboard = new InlineKeyboard().text(yes, `${prefix}${CONFIRMED}`).text(no, `${prefix}${DECLINED}`);

        return ctx.reply(ask, { reply_markup: keyboard });
      }
    });
  }

  async confirmed({ ctx, prefix, cancelled, act }: ConfirmedInput): Promise<void> {
    await this.answered({
      ctx,
      prefix,
      act: async ({ chat, value }) => {
        if (!isConfirmed(value)) {
          return this.reply({ ctx, chat, text: cancelled(BOT_TEXT[chat.locale]) });
        }

        return act(chat);
      }
    });
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
