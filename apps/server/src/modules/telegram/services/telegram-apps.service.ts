import { CLIENT_IDS } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNonNullish, isNullish } from 'remeda';

import type { BotContext, ShowClientInput } from '../telegram.types';

import { SubscriptionService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { BOT_TEXT, CALLBACK_PREFIX, TEXT_TOKEN } from '../config';
import { clientName, parseClientId } from '../lib';
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
    const { clients } = await this.subscriptionLink.get(chat.userId);
    const client = clients.find((entry) => entry.id === id);

    if (isNullish(client)) {
      return;
    }

    const platforms = client.platforms.join(', ');
    const lines = [
      clientName({ id, locale: chat.locale }),
      '',
      text.appsPlatforms.replace(TEXT_TOKEN.platforms, platforms),
      '',
      `${text.appsDownload}: ${client.downloadUrl}`
    ];

    if (isNonNullish(client.importUrl)) {
      lines.push('', `${text.appsImport}: ${client.importUrl}`);
    } else {
      const { url } = await this.subscriptionLink.get(chat.userId);

      lines.push('', text.appsManual, '', url);
    }

    await ctx.reply(lines.join('\n'), { link_preview_options: { is_disabled: true } });
  }
}
