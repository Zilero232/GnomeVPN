import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext, ChatCopy, ConsumeInput, RefusalInput, SpeakInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { AccountService, IdentityService } from '../../auth';
import { BOT_TEXT, CALLBACK_PREFIX, CONFIRMED, LANGUAGE_BUTTONS, NEW_LINE, TEXT_TOKEN } from '../config';
import { identityOf, isConfirmed, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramSharedService } from './telegram-shared.service';
import { TelegramWebLoginService } from './telegram-web-login.service';

@Injectable()
export class TelegramAccountService {
  private readonly logger = new Logger(TelegramAccountService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly link: TelegramLinkService,
    private readonly identity: IdentityService,
    private readonly webLogin: TelegramWebLoginService,
    private readonly config: AppConfigService,
    private readonly account: AccountService
  ) {}

  async welcome(ctx: BotContext): Promise<void> {
    const identity = identityOf(ctx.from);

    if (isNullish(identity)) {
      return;
    }

    const chat = await this.link.ensureChat(identity);
    const start = BOT_TEXT[chat.locale].start.replace(TEXT_TOKEN.site, this.config.get('CLIENT_URL'));

    await this.shared.reply({ ctx, chat, text: start });
  }

  async help(ctx: BotContext): Promise<void> {
    await this.speak({ ctx, pick: (copy) => copy.help });
  }

  async openWebsite(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async ({ userId, locale }) => {
        const text = BOT_TEXT[locale];
        const url = await this.webLogin.issue(userId);

        return ctx.reply([text.websiteIntro, '', url].join(NEW_LINE), { link_preview_options: { is_disabled: true } });
      }
    });
  }

  async askUnlink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async ({ userId, locale }) => {
        const text = BOT_TEXT[locale];

        if (!(await this.identity.hasRealEmail(userId))) {
          return ctx.reply(text.unlinkNoEmail);
        }

        const keyboard = new InlineKeyboard()
          .text(text.unlinkYes, `${CALLBACK_PREFIX.unlink}${CONFIRMED}`)
          .text(text.unlinkNo, `${CALLBACK_PREFIX.unlink}no`);

        return ctx.reply(text.unlinkAsk, { reply_markup: keyboard });
      }
    });
  }

  async askDelete(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: ({ locale }) => {
        const text = BOT_TEXT[locale];
        const keyboard = new InlineKeyboard()
          .text(text.deleteYes, `${CALLBACK_PREFIX.deleteAccount}${CONFIRMED}`)
          .text(text.deleteNo, `${CALLBACK_PREFIX.deleteAccount}no`);

        return ctx.reply(text.deleteAsk, { reply_markup: keyboard });
      }
    });
  }

  async confirmDelete(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.deleteAccount,
      act: async ({ chat, value }) => {
        const text = BOT_TEXT[chat.locale];

        if (!isConfirmed(value)) {
          return this.shared.reply({ ctx, chat, text: text.deleteCancelled });
        }

        await this.account.remove(chat.userId);

        return ctx.reply(text.deleted, { reply_markup: { remove_keyboard: true } });
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
    const { copy } = await this.copyFor(ctx);
    const keyboard = new InlineKeyboard();

    for (const { locale, label } of LANGUAGE_BUTTONS) {
      keyboard.text(label, `${CALLBACK_PREFIX.locale}${locale}`);
    }

    await ctx.reply(copy.chooseLanguage, { reply_markup: keyboard });
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

    try {
      await this.link.consumeCode({ code: text, ...identity });

      const chat = await this.link.findChat(identity.telegramId);

      await this.shared.reply({ ctx, chat, text: chat ? BOT_TEXT[chat.locale].linked : copy.linked });
    } catch (error) {
      await ctx.reply(this.refusalFor({ error, copy }));
    }
  }

  private async speak({ ctx, pick }: SpeakInput): Promise<void> {
    const { chat, copy } = await this.copyFor(ctx);

    await this.shared.reply({ ctx, chat, text: pick(copy) });
  }

  private async copyFor(ctx: BotContext): Promise<ChatCopy> {
    const identity = identityOf(ctx.from);
    const chat = isNullish(identity) ? null : await this.link.findChat(identity.telegramId);

    return { chat, copy: chat ? BOT_TEXT[chat.locale] : this.shared.textFor(ctx) };
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
