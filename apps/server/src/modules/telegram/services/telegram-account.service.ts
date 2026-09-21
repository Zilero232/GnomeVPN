import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext, ConsumeInput, RefusalInput, SpeakInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { BOT_TEXT, CALLBACK_PREFIX, CONFIRMED, LANGUAGE_BUTTONS } from '../config';
import { identityOf, isConfirmed, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramAccountService {
  private readonly logger = new Logger(TelegramAccountService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly link: TelegramLinkService
  ) {}

  async welcome(ctx: BotContext): Promise<void> {
    await this.speak({ ctx, pick: (copy) => copy.start });
  }

  async help(ctx: BotContext): Promise<void> {
    await this.speak({ ctx, pick: (copy) => copy.help });
  }

  async askUnlink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: ({ locale }) => {
        const text = BOT_TEXT[locale];
        const keyboard = new InlineKeyboard()
          .text(text.unlinkYes, `${CALLBACK_PREFIX.unlink}${CONFIRMED}`)
          .text(text.unlinkNo, `${CALLBACK_PREFIX.unlink}no`);

        return ctx.reply(text.unlinkAsk, { reply_markup: keyboard });
      }
    });
  }

  async confirmUnlink(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.unlink,
      act: async ({ chat, value }) => {
        const text = BOT_TEXT[chat.locale];

        if (!isConfirmed(value)) {
          return this.shared.reply({ ctx, chat, text: text.unlinkCancelled });
        }

        await this.link.unlink(chat.userId);

        return ctx.reply(text.unlinked, { reply_markup: { remove_keyboard: true } });
      }
    });
  }

  async chooseLanguage(ctx: BotContext): Promise<void> {
    const keyboard = new InlineKeyboard();

    for (const { locale, label } of LANGUAGE_BUTTONS) {
      keyboard.text(label, `${CALLBACK_PREFIX.locale}${locale}`);
    }

    await ctx.reply(this.shared.textFor(ctx).chooseLanguage, { reply_markup: keyboard });
  }

  async changeLocale(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.locale,
      act: async ({ chat, value }) => {
        const locale = resolveLocale(value);

        await this.link.setLocale({ telegramId: chat.telegramId, locale });

        return this.shared.reply({ ctx, chat: { ...chat, locale }, text: BOT_TEXT[locale].languageChanged });
      }
    });
  }

  async consume({ ctx, text }: ConsumeInput): Promise<void> {
    const identity = identityOf(ctx.from);

    if (isNullish(identity)) {
      return;
    }

    const copy = this.shared.textFor(ctx);

    if (await this.link.findUserId(identity.telegramId)) {
      await ctx.reply(copy.alreadyLinked);

      return;
    }

    try {
      await this.link.consumeCode({ code: text, ...identity });

      const chat = await this.link.findChat(identity.telegramId);

      await this.shared.reply({ ctx, chat, text: chat ? BOT_TEXT[chat.locale].linked : copy.linked });
    } catch (error) {
      await ctx.reply(this.refusalFor({ error, copy }));
    }
  }

  private async speak({ ctx, pick }: SpeakInput): Promise<void> {
    const identity = identityOf(ctx.from);
    const chat = isNullish(identity) ? null : await this.link.findChat(identity.telegramId);
    const copy = chat ? BOT_TEXT[chat.locale] : this.shared.textFor(ctx);

    await this.shared.reply({ ctx, chat, text: pick(copy) });
  }

  private refusalFor({ error, copy }: RefusalInput): string {
    return match(errorCodeOf(error))
      .with('TELEGRAM_ALREADY_LINKED', () => copy.alreadyLinked)
      .with('TELEGRAM_CODE_INVALID', () => copy.codeInvalid)
      .otherwise(() => {
        this.logger.warn(`telegram link failed: ${describeError(error)}`);

        return copy.failed;
      });
  }
}
