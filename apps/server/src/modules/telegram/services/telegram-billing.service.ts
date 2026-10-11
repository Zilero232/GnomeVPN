import { Injectable } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { BotContext } from '../telegram.types';

import { AutoRenewService } from '../../billing';
import { SubscriptionService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { AUTO_RENEW_CHOICE, BOT_TEXT, CALLBACK_PREFIX } from '../config';
import { autoRenewChoice, autoRenewPanel, linkMessage, rotateCopy } from '../lib';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramBillingService {
  constructor(
    private readonly shared: TelegramSharedService,
    private readonly subscription: SubscriptionService,
    private readonly subscriptionLink: SubscriptionLinkService,
    private readonly autoRenewal: AutoRenewService
  ) {}

  async askRotate(ctx: BotContext): Promise<void> {
    await this.shared.ask({ ctx, prefix: CALLBACK_PREFIX.rotate, pick: rotateCopy });
  }

  async confirmRotate(ctx: BotContext): Promise<void> {
    await this.shared.confirmed({
      ctx,
      prefix: CALLBACK_PREFIX.rotate,
      cancelled: (copy) => copy.rotateCancelled,
      act: async (chat) => {
        const { url } = await this.subscriptionLink.rotate(chat.userId);

        return this.shared.reply({ ctx, chat, ...linkMessage({ locale: chat.locale, intro: BOT_TEXT[chat.locale].rotateDone, url }) });
      }
    });
  }

  async autoRenew(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const status = await this.subscription.getStatus(chat.userId);

        return this.shared.reply({ ctx, chat, ...autoRenewPanel({ status, locale: chat.locale }) });
      }
    });
  }

  async changeAutoRenew(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.autoRenew,
      act: async ({ chat, value }) => {
        const choice = autoRenewChoice(value);

        if (isNullish(choice)) {
          return;
        }

        await (choice === AUTO_RENEW_CHOICE.on ? this.autoRenewal.resumeAutoRenew(chat.userId) : this.autoRenewal.cancelAutoRenew(chat.userId));

        const status = await this.subscription.getStatus(chat.userId);

        return this.shared.edit({ ctx, ...autoRenewPanel({ status, locale: chat.locale }) });
      }
    });
  }
}
