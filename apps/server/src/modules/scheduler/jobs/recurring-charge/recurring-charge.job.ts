import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, subHours } from 'date-fns';
import { isNonNullish } from 'remeda';

import type { ChargeAttemptInput, DueSubscription } from './recurring-charge.job.types';

import { describeError } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { YooKassaClient } from '../../../../lib';
import { CardService, CheckoutService, describeRenewal, renewalIdempotenceKey, WebhookService } from '../../../billing';
import { trialState } from '../../../subscription';
import { TelegramNotifyService } from '../../../telegram/services/telegram-notify.service';
import { WINDOW } from '../../config';

@Injectable()
export class RecurringChargeJob {
  private readonly logger = new Logger(RecurringChargeJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly checkout: CheckoutService,
    private readonly card: CardService,
    private readonly webhook: WebhookService,
    private readonly notify: TelegramNotifyService
  ) {}

  private async wasAttempted({ userId, currentPeriodEnd }: ChargeAttemptInput): Promise<boolean> {
    const attempt = await this.prisma.payment.findFirst({
      where: {
        userId,
        isAutoCharge: true,
        status: { in: ['pending', 'canceled'] },
        createdAt: { gt: subHours(currentPeriodEnd, WINDOW.renewHours) }
      },
      select: { id: true }
    });

    return isNonNullish(attempt);
  }

  private async chargeIfDue(subscription: DueSubscription): Promise<void> {
    if (!subscription.savedCardId || !subscription.currentPeriodEnd || trialState(subscription).isTrial) {
      return;
    }

    if (await this.wasAttempted({ userId: subscription.userId, currentPeriodEnd: subscription.currentPeriodEnd })) {
      return;
    }

    const plan = findPlan(subscription.plan);

    const payment = await this.yookassa.chargeRecurring({
      amountRub: plan.priceRub,
      description: describeRenewal(plan),
      paymentMethodId: subscription.savedCardId,
      idempotenceKey: renewalIdempotenceKey({
        userId: subscription.userId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paymentMethodId: subscription.savedCardId,
        amountRub: plan.priceRub
      })
    });

    await this.checkout.recordPendingPayment({
      userId: subscription.userId,
      paymentId: payment.id,
      plan,
      isAutoCharge: true
    });

    if (payment.status === 'pending') {
      return;
    }

    await this.webhook.settlePayment(payment.id);
  }

  private async dropUnusableCard(subscription: DueSubscription): Promise<void> {
    if (!subscription.savedCardId) {
      return;
    }

    const isUsable = await this.yookassa.isPaymentMethodUsable(subscription.savedCardId);

    if (isUsable !== false) {
      return;
    }

    await this.card.unbindCard(subscription.userId);

    this.logger.warn(`Dropped an unusable saved card for ${subscription.userId}`);

    await this.tellChargeFailed(subscription);
  }

  private async tellChargeFailed({ userId, currentPeriodEnd }: DueSubscription): Promise<void> {
    await this.notify.tell({ userId, pick: (copy) => copy.chargeFailed, date: currentPeriodEnd });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: false,
        savedCardId: { not: null },
        currentPeriodEnd: {
          gt: new Date(),
          lt: addHours(new Date(), WINDOW.renewHours)
        }
      },
      select: { userId: true, savedCardId: true, plan: true, currentPeriodEnd: true, trialStartedAt: true }
    });

    for (const subscription of due) {
      try {
        await this.chargeIfDue(subscription);
      } catch (error) {
        this.logger.warn(`Recurring charge failed for ${subscription.userId}: ${describeError(error)}`);

        await this.dropUnusableCard(subscription).catch((checkError: unknown) => {
          this.logger.warn(`Could not check the saved card of ${subscription.userId}: ${describeError(checkError)}`);
        });
      }
    }
  }
}
