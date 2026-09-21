import { PLANS } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNonNullish, isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { BotContext, ClaimTrialInput, ReplyWithLinkInput, ReplyWithPlansInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { CheckoutService } from '../../billing';
import { SubscriptionService, TrialService } from '../../subscription';
import { SubscriptionLinkService } from '../../subscription-link';
import { BOT_TEXT, CALLBACK_PREFIX } from '../config';
import { identityOf, parsePlanId, planButtonLabel, statusText } from '../lib';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramSubscriptionService {
  private readonly logger = new Logger(TelegramSubscriptionService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly link: TelegramLinkService,
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

        return this.shared.reply({ ctx, chat, text: statusText({ ...status, locale: chat.locale }) });
      }
    });
  }

  async sendLink(ctx: BotContext): Promise<void> {
    await this.shared.withUser({ ctx, act: (chat) => this.replyWithLink({ ctx, chat }) });
  }

  async buy(ctx: BotContext): Promise<void> {
    await this.shared.withUser({ ctx, act: ({ locale }) => this.replyWithPlans({ ctx, locale }) });
  }

  async claimTrialDay(ctx: BotContext): Promise<void> {
    await this.shared.withUser({ ctx, act: ({ userId, locale }) => this.claimTrial({ ctx, userId, locale }) });
  }

  async startCheckout(ctx: BotContext): Promise<void> {
    const identity = identityOf(ctx.from);
    const data = ctx.callbackQuery?.data;

    if (isNullish(identity) || isNullish(data)) {
      return;
    }

    await ctx.answerCallbackQuery();

    const chat = await this.link.findChat(identity.telegramId);

    if (isNullish(chat)) {
      await ctx.reply(this.shared.textFor(ctx).notLinked);

      return;
    }

    const text = BOT_TEXT[chat.locale];
    const planId = parsePlanId(data.slice(CALLBACK_PREFIX.plan.length));

    if (isNullish(planId)) {
      return;
    }

    try {
      const { confirmationUrl } = await this.checkout.createCheckout({ userId: chat.userId, planId });

      await ctx.reply([text.checkoutIntro, '', confirmationUrl].join('\n'));
    } catch (error) {
      this.logger.warn(`telegram checkout failed: ${describeError(error)}`);

      await ctx.reply(text.failed);
    }
  }

  private async replyWithLink({ ctx, chat }: ReplyWithLinkInput): Promise<void> {
    const text = BOT_TEXT[chat.locale];

    if (!(await this.subscription.hasActiveAccess(chat.userId))) {
      await ctx.reply(text.noSubscription);

      return;
    }

    const { url } = await this.subscriptionLink.get(chat.userId);

    await ctx.reply([text.linkIntro, '', url, '', text.linkWarning].join('\n'));
  }

  private async replyWithPlans({ ctx, locale }: ReplyWithPlansInput): Promise<void> {
    const keyboard = new InlineKeyboard();

    for (const plan of PLANS) {
      keyboard.text(planButtonLabel({ plan, locale }), `${CALLBACK_PREFIX.plan}${plan.id}`).row();
    }

    await ctx.reply(BOT_TEXT[locale].choosePlan, { reply_markup: keyboard });
  }

  private async claimTrial({ ctx, userId, locale }: ClaimTrialInput): Promise<void> {
    const text = BOT_TEXT[locale];
    const eligibility = await this.trial.eligibility(userId);

    const refusal = match(eligibility)
      .with('emailUnverified', () => text.trialNeedsEmail)
      .with('used', () => text.trialUnavailable)
      .otherwise(() => null);

    if (isNonNullish(refusal)) {
      await this.shared.reply({ ctx, chat: { userId, locale }, text: refusal });

      return;
    }

    await this.trial.claim(userId);

    await this.shared.reply({ ctx, chat: { userId, locale }, text: text.trialGranted });
  }
}
