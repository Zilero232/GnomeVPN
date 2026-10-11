import { Injectable, Logger } from '@nestjs/common';
import { isNonNullish, isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext, BotLocale, ChatCopy, ConsumeInput, RefusalInput, SpeakInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { AccountService, IdentityService } from '../../auth';
import { BOT_TEXT, CALLBACK_PREFIX, DEFAULT_BOT_LOCALE, MESSAGE_EFFECT } from '../config';
import { deleteCopy, fillText, html, identityOf, languageKeyboard, moreKeyboard, resolveLocale, unlinkCopy, urlMessage } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramNotifyService } from './telegram-notify.service';
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
    private readonly account: AccountService,
    private readonly notify: TelegramNotifyService
  ) {}

  async welcome(ctx: BotContext): Promise<void> {
    const identity = identityOf(ctx.from);

    if (isNullish(identity)) {
      return;
    }

    const chat = await this.link.ensureChat(identity);

    await this.shared.reply({ ctx, chat, text: this.startText(chat.locale) });
  }

  async help(ctx: BotContext): Promise<void> {
    await this.speak({ ctx, pick: (copy) => copy.help });
  }

  async more(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const state = await this.notify.stateOf(chat.userId);

        return this.shared.reply({ ctx, chat, text: BOT_TEXT[chat.locale].moreTitle, markup: moreKeyboard({ locale: chat.locale, state }) });
      }
    });
  }

  async openWebsite(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const text = BOT_TEXT[chat.locale];
        const url = await this.webLogin.issue(chat.userId);

        return this.shared.reply({ ctx, chat, ...urlMessage({ intro: text.websiteIntro, url, label: text.openSite, style: 'primary' }) });
      }
    });
  }

  async askUnlink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        if (await this.identity.hasRealEmail(chat.userId)) {
          return this.shared.ask({ ctx, prefix: CALLBACK_PREFIX.unlink, pick: unlinkCopy });
        }

        return this.shared.reply({ ctx, chat, text: BOT_TEXT[chat.locale].unlinkNoEmail });
      }
    });
  }

  async askDelete(ctx: BotContext): Promise<void> {
    await this.shared.ask({ ctx, prefix: CALLBACK_PREFIX.deleteAccount, pick: deleteCopy });
  }

  async confirmDelete(ctx: BotContext): Promise<void> {
    await this.shared.confirmed({
      ctx,
      prefix: CALLBACK_PREFIX.deleteAccount,
      cancelled: (copy) => copy.deleteCancelled,
      act: async (chat) => {
        await this.account.remove(chat.userId);

        return ctx.reply(BOT_TEXT[chat.locale].deleted, { reply_markup: { remove_keyboard: true } });
      }
    });
  }

  async confirmUnlink(ctx: BotContext): Promise<void> {
    await this.shared.confirmed({
      ctx,
      prefix: CALLBACK_PREFIX.unlink,
      cancelled: (copy) => copy.unlinkCancelled,
      act: async (chat) => {
        await this.link.unlink(chat.userId);

        return ctx.reply(BOT_TEXT[chat.locale].unlinked, { reply_markup: { remove_keyboard: true } });
      }
    });
  }

  async chooseLanguage(ctx: BotContext): Promise<void> {
    const { chat, copy } = await this.copyFor(ctx);

    await ctx.reply(copy.chooseLanguage, { reply_markup: languageKeyboard(chat?.locale) });
  }

  async changeLocale(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.locale,
      act: async ({ chat, value }) => {
        const locale = resolveLocale(value);

        await Promise.all([this.link.setLocale({ telegramId: chat.telegramId, locale }), this.shared.settle(ctx)]);

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
    const known = await this.link.findChat(identity.telegramId);

    try {
      await this.link.consumeCode({ code: text, ...identity });
    } catch (error) {
      await this.shared.reply({ ctx, chat: known, text: this.refusalFor({ error, copy }) });

      return;
    }

    const chat = await this.link.findChat(identity.telegramId);
    const locale = chat?.locale ?? DEFAULT_BOT_LOCALE;
    const linked = BOT_TEXT[locale].linked;
    const greeting = isNonNullish(known) ? linked : html.paragraphs([this.startText(locale), linked]);

    await this.shared.reply({ ctx, chat, text: greeting, effect: MESSAGE_EFFECT.celebrate });
  }

  private startText(locale: BotLocale): string {
    return fillText({ text: BOT_TEXT[locale].start, fill: { site: this.config.get('CLIENT_URL') } });
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
