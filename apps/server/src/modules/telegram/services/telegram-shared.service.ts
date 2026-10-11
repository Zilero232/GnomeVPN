import { Injectable, Logger } from '@nestjs/common';
import { GrammyError } from 'grammy';
import { isNullish } from 'remeda';

import type {
  AnsweredInput,
  AskInput,
  AttemptInput,
  BotContext,
  BotText,
  ConfirmedInput,
  EditInput,
  ReplyInput,
  WithUserInput
} from '../telegram.types';

import { describeError } from '../../../common/lib';
import { BOT_TEXT, EDIT } from '../config';
import { confirmKeyboard, identityOf, isConfirmed, mainKeyboard, resolveLocale } from '../lib';
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

  async reply({ ctx, chat, text, markup, effect }: ReplyInput): Promise<void> {
    const keyboard = markup ?? (chat ? mainKeyboard({ locale: chat.locale, state: await this.notify.stateOf(chat.userId) }) : undefined);

    await ctx.reply(text, { reply_markup: keyboard, message_effect_id: effect });
  }

  async edit({ ctx, text, markup }: EditInput): Promise<void> {
    if (isNullish(ctx.callbackQuery?.message)) {
      await ctx.reply(text, { reply_markup: markup });

      return;
    }

    try {
      await ctx.editMessageText(text, { reply_markup: markup });
    } catch (error) {
      if (!(error instanceof GrammyError)) {
        throw error;
      }

      if (EDIT.unchanged.test(error.description)) {
        return;
      }

      if (!EDIT.uneditable.test(error.description)) {
        throw error;
      }

      await ctx.reply(text, { reply_markup: markup });
    }
  }

  async settle(ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch((error: unknown) => {
      this.logger.debug(`could not clear telegram buttons: ${describeError(error)}`);
    });
  }

  typing(ctx: BotContext): void {
    ctx.replyWithChatAction('typing').catch((error: unknown) => {
      this.logger.debug(`could not show telegram typing: ${describeError(error)}`);
    });
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
        const copy = pick(BOT_TEXT[locale]);

        return ctx.reply(copy.ask, { reply_markup: confirmKeyboard({ copy, prefix }) });
      }
    });
  }

  async confirmed({ ctx, prefix, cancelled, act }: ConfirmedInput): Promise<void> {
    await this.answered({
      ctx,
      prefix,
      act: async ({ chat, value }) => {
        if (!isConfirmed(value)) {
          return this.edit({ ctx, text: cancelled(BOT_TEXT[chat.locale]) });
        }

        return Promise.all([this.settle(ctx), act(chat)]);
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
