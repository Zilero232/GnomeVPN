import { DEFAULT_DEVICE_LIMIT, EXTRA_DEVICE_PRICE_RUB, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { FormattedString } from '@grammyjs/parse-mode';
import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';

import type { BotContext, ReplyWithLinkInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AutoRenewService, CheckoutService } from '../../billing';
import { SubscriptionService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { AUTO_RENEW_CHOICE, BOT_TEXT, CALLBACK_PREFIX, DEVICE_CHOICES, NEW_LINE, TEXT_TOKEN } from '../config';
import { autoRenewChoice, countFrom, formatDate, rotateCopy } from '../lib';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramBillingService {
  private readonly logger = new Logger(TelegramBillingService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly subscription: SubscriptionService,
    private readonly subscriptionLink: SubscriptionLinkService,
    private readonly checkout: CheckoutService,
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

  async devices(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const status = await this.subscription.getStatus(chat.userId);
        const text = BOT_TEXT[chat.locale];

        if (status.limits.deviceLimit - DEFAULT_DEVICE_LIMIT >= MAX_EXTRA_DEVICES) {
          return this.shared.reply({ ctx, chat, text: text.devicesMax });
        }

        const keyboard = new InlineKeyboard();

        for (const quantity of DEVICE_CHOICES) {
          keyboard.text(`+${quantity}`, `${CALLBACK_PREFIX.devices}${quantity}`);
        }

        const intro = text.devicesNow
          .replace(TEXT_TOKEN.count, String(status.limits.deviceLimit))
          .replace(TEXT_TOKEN.price, String(EXTRA_DEVICE_PRICE_RUB));

        return ctx.reply([intro, '', text.devicesChoose].join('\n'), { reply_markup: keyboard });
      }
    });
  }

  async buyDevices(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.devices,
      act: async ({ chat, value }) => {
        const quantity = countFrom(value, MAX_EXTRA_DEVICES);
        const text = BOT_TEXT[chat.locale];

        if (isNullish(quantity)) {
          return;
        }

        try {
          const { confirmationUrl } = await this.checkout.buyExtraDevices({ userId: chat.userId, quantity });

          await ctx.reply([text.devicesIntro, '', confirmationUrl].join('\n'));
        } catch (error) {
          this.logger.warn(`telegram extra devices failed: ${describeError(error)}`);

          await this.shared.reply({ ctx, chat, text: text.failed });
        }
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
      : text.autoRenewOff.replace(TEXT_TOKEN.date, formatDate({ iso: status.currentPeriodEnd, locale: chat.locale }));

    await ctx.reply(body, { reply_markup: keyboard });
  }
}
