import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext, ConsumeInput, RefusalInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { BOT_TEXT, LANGUAGE_BUTTONS, LOCALE_CALLBACK_PREFIX } from '../config';
import { identityOf, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramAccountService {
  private readonly logger = new Logger(TelegramAccountService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly link: TelegramLinkService
  ) {}

  async unlink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async ({ userId, locale }) => {
        await this.link.unlink(userId);

        return ctx.reply(BOT_TEXT[locale].unlinked);
      }
    });
  }

  async chooseLanguage(ctx: BotContext): Promise<void> {
    const keyboard = new InlineKeyboard();

    for (const { locale, label } of LANGUAGE_BUTTONS) {
      keyboard.text(label, `${LOCALE_CALLBACK_PREFIX}${locale}`);
    }

    await ctx.reply(this.shared.textFor(ctx).chooseLanguage, { reply_markup: keyboard });
  }

  async changeLocale(ctx: BotContext): Promise<void> {
    const identity = identityOf(ctx.from);
    const data = ctx.callbackQuery?.data;

    if (isNullish(identity) || isNullish(data)) {
      return;
    }

    await ctx.answerCallbackQuery();

    const locale = resolveLocale(data.slice(LOCALE_CALLBACK_PREFIX.length));

    await this.link.setLocale({ telegramId: identity.telegramId, locale });
    await ctx.reply(BOT_TEXT[locale].languageChanged);
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

      await ctx.reply(copy.linked);
    } catch (error) {
      await ctx.reply(this.refusalFor({ error, copy }));
    }
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
