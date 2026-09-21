import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { BotContext, BotText, WithUserInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { BOT_TEXT, DEFAULT_BOT_LOCALE } from '../config';
import { identityOf, resolveLocale } from '../lib';
import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramSharedService {
  private readonly logger = new Logger(TelegramSharedService.name);

  constructor(private readonly link: TelegramLinkService) {}

  textFor(ctx: BotContext): BotText {
    return BOT_TEXT[resolveLocale(ctx.from?.language_code) ?? DEFAULT_BOT_LOCALE];
  }

  async withUser({ ctx, act }: WithUserInput): Promise<void> {
    const identity = identityOf(ctx.from);

    if (isNullish(identity)) {
      return;
    }

    const chat = await this.link.findChat(identity.telegramId);

    if (isNullish(chat)) {
      await ctx.reply(this.textFor(ctx).notLinked);

      return;
    }

    void this.link.touch(identity);

    try {
      await act(chat);
    } catch (error) {
      this.logger.warn(`telegram command failed: ${describeError(error)}`);

      await ctx.reply(BOT_TEXT[chat.locale].failed);
    }
  }
}
