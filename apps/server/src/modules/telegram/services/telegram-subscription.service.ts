import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { CheckoutService } from '../../billing';
import { SubscriptionService, TrialService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { BOT_TEXT, CALLBACK_PREFIX, MESSAGE_EFFECT } from '../config';
import {
  fillLabel,
  fillText,
  linkMessage,
  menuButtons,
  offerKeys,
  parsePlanId,
  planKeyboard,
  planLabel,
  plansText,
  statusText,
  urlMessage
} from '../lib';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramSubscriptionService {
  private readonly logger = new Logger(TelegramSubscriptionService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly subscription: SubscriptionService,
    private readonly subscriptionLink: SubscriptionLinkService,
    private readonly checkout: CheckoutService,
    private readonly trial: TrialService
  ) {}

  async status(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const status = await this.subscription.getStatus(chat.userId);

        return this.shared.reply({
          ctx,
          chat,
          text: statusText({ ...status, locale: chat.locale }),
          markup: menuButtons({ locale: chat.locale, keys: offerKeys(status) })
        });
      }
    });
  }

  async sendLink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const text = BOT_TEXT[chat.locale];
        const status = await this.subscription.getStatus(chat.userId);

        if (status.period === 'none') {
          return this.shared.reply({ ctx, chat, text: text.noSubscription, markup: menuButtons({ locale: chat.locale, keys: offerKeys(status) }) });
        }

        const { url } = await this.subscriptionLink.get(chat.userId);

        return this.shared.reply({ ctx, chat, ...linkMessage({ locale: chat.locale, intro: text.linkIntro, url }) });
      }
    });
  }

  async buy(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: ({ locale }) => ctx.reply(plansText(locale), { reply_markup: planKeyboard(locale) })
    });
  }

  async claimTrialDay(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const text = BOT_TEXT[chat.locale];
        const eligibility = await this.trial.eligibility(chat.userId);

        const refusal = match(eligibility)
          .with('emailUnverified', () => text.trialNeedsEmail)
          .with('used', () => text.trialUnavailable)
          .with('available', () => null)
          .exhaustive();

        if (refusal) {
          return this.shared.reply({ ctx, chat, text: refusal });
        }

        await this.trial.claim(chat.userId);

        return this.shared.reply({ ctx, chat, text: text.trialGranted, effect: MESSAGE_EFFECT.celebrate });
      }
    });
  }

  async startCheckout(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.plan,
      act: async ({ chat, value }) => {
        const text = BOT_TEXT[chat.locale];
        const planId = parsePlanId(value);

        if (isNullish(planId)) {
          return;
        }

        this.shared.typing(ctx);

        try {
          const { confirmationUrl } = await this.checkout.createCheckout({ userId: chat.userId, planId });
          const amount = String(findPlan(planId).priceRub);
          const intro = fillText({ text: text.checkoutIntro, fill: { plan: planLabel({ planId, locale: chat.locale }), amount } });
          const label = fillLabel({ text: text.checkoutButton, fill: { amount } });

          return this.shared.edit({ ctx, ...urlMessage({ intro, url: confirmationUrl, label, style: 'success' }) });
        } catch (error) {
          if (errorCodeOf(error) === 'PLAN_CHANGE_LOCKED') {
            return this.shared.reply({ ctx, chat, text: text.planChangeLocked });
          }

          this.logger.warn(`telegram checkout failed: ${describeError(error)}`);

          return this.shared.reply({ ctx, chat, text: text.failed });
        }
      }
    });
  }
}
