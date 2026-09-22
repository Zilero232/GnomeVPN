import type { Stringable } from '@grammyjs/parse-mode';

import { CLIENT_IDS } from '@gnomevpn/schemas';
import { FormattedString } from '@grammyjs/parse-mode';
import { Injectable } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNonNullish, isNullish } from 'remeda';

import type { BotContext, ShowClientInput } from '../telegram.types';

import { SubscriptionService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { BOT_TEXT, CALLBACK_PREFIX, NEW_LINE, TEXT_TOKEN } from '../config';
import { clientName, parseClientId, platformNames } from '../lib';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramAppsService {
  constructor(
    private readonly shared: TelegramSharedService,
    private readonly subscription: SubscriptionService,
    private readonly subscriptionLink: SubscriptionLinkService
  ) {}

  async list(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const text = BOT_TEXT[chat.locale];

        if (!(await this.subscription.hasActiveAccess(chat.userId))) {
          return this.shared.reply({ ctx, chat, text: text.noSubscription });
        }

        const keyboard = new InlineKeyboard();

        for (const id of CLIENT_IDS) {
          keyboard.text(clientName({ id, locale: chat.locale }), `${CALLBACK_PREFIX.client}${id}`).row();
        }

        return ctx.reply(text.appsIntro, { reply_markup: keyboard });
      }
    });
  }

  async show(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.client,
      act: async ({ chat, value }) => {
        const id = parseClientId(value);

        if (isNullish(id)) {
          return;
        }

        await this.describe({ ctx, chat, id });
      }
    });
  }

  private async describe({ ctx, chat, id }: ShowClientInput): Promise<void> {
    const text = BOT_TEXT[chat.locale];
    const { clients, url } = await this.subscriptionLink.get(chat.userId);
    const client = clients.find((entry) => entry.id === id);

    if (isNullish(client)) {
      return;
    }

    const platforms = platformNames({ platforms: client.platforms, locale: chat.locale });
    const lines: Stringable[] = [
      clientName({ id, locale: chat.locale }),
      '',
      text.appsPlatforms.replace(TEXT_TOKEN.platforms, platforms),
      '',
      `${text.appsDownload}: ${client.downloadUrl}`,
      ''
    ];

    if (isNonNullish(client.importUrl)) {
      lines.push(text.appsImport, FormattedString.code(client.importUrl));
    } else {
      lines.push(text.appsManual, '', FormattedString.code(url));
    }

    const message = FormattedString.join(lines, NEW_LINE);

    await ctx.reply(message.text, { entities: message.entities, link_preview_options: { is_disabled: true } });
  }
}
