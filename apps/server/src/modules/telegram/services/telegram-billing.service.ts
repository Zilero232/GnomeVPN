import { FormattedString } from '@grammyjs/parse-mode';
import { Injectable } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';

import type { BotContext, ReplyWithLinkInput } from '../telegram.types';

import { AutoRenewService } from '../../billing';
import { SubscriptionService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { AUTO_RENEW_CHOICE, BOT_TEXT, CALLBACK_PREFIX, NEW_LINE } from '../config';
import { autoRenewChoice, fillText, formatDate, rotateCopy } from '../lib';
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
        const message = FormattedString.join([BOT_TEXT[chat.locale].rotateDone, '', FormattedString.code(url)], NEW_LINE);

        return ctx.reply(message.text, { entities: message.entities, link_preview_options: { is_disabled: true } });
      }
    });
  }

  async autoRenew(ctx: BotContext): Promise<void> {
    await this.shared.withUser({ ctx, act: (chat) => this.showAutoRenew({ ctx, chat }) });
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

        return this.showAutoRenew({ ctx, chat });
      }
    });
  }

  private async showAutoRenew({ ctx, chat }: ReplyWithLinkInput): Promise<void> {
    const status = await this.subscription.getStatus(chat.userId);
    const text = BOT_TEXT[chat.locale];

    if (status.cancelAtPeriodEnd && !status.hasPaymentMethod) {
      await this.shared.reply({ ctx, chat, text: text.autoRenewNeedsCard });

      return;
    }

    const isOn = !status.cancelAtPeriodEnd;
    const choice = isOn ? AUTO_RENEW_CHOICE.off : AUTO_RENEW_CHOICE.on;
    const keyboard = new InlineKeyboard().text(isOn ? text.autoRenewDisable : text.autoRenewEnable, `${CALLBACK_PREFIX.autoRenew}${choice}`);
    const body = isOn
      ? text.autoRenewOn
      : fillText({ text: text.autoRenewOff, fill: { date: formatDate({ iso: status.currentPeriodEnd, locale: chat.locale }) } });

    await ctx.reply(body, { reply_markup: keyboard });
  }
}
