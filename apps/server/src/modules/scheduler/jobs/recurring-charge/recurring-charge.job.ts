import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, subHours } from 'date-fns';
import { isNonNullish } from 'remeda';

import type { DueSubscription } from './recurring-charge.job.types';

import { describeError } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { YooKassaClient } from '../../../../lib';
import {
  CheckoutService,
  describeRenewal,
  renewalIdempotenceKey,
  WebhookService
} from '../../../billing';
import { IN_FLIGHT_WINDOW_HOURS, RENEW_WINDOW_HOURS } from '../../config';

@Injectable()
export class RecurringChargeJob {
  private readonly logger = new Logger(RecurringChargeJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly checkout: CheckoutService,
    private readonly webhook: WebhookService
  ) {}

  private async hasChargeInFlight(userId: string): Promise<boolean> {
    const pending = await this.prisma.payment.findFirst({
      where: {
        userId,
        isAutoCharge: true,
        status: 'pending',
        createdAt: { gt: subHours(new Date(), IN_FLIGHT_WINDOW_HOURS) }
      },
      select: { id: true }
    });

    return isNonNullish(pending);
  }

  private async chargeIfDue(subscription: DueSubscription): Promise<void> {
    if (!subscription.savedCardId || !subscription.currentPeriodEnd) {
      return;
    }

    if (await this.hasChargeInFlight(subscription.userId)) {
      return;
    }

    const plan = findPlan(subscription.plan);

    const payment = await this.yookassa.chargeRecurring({
      amountRub: plan.priceRub,
      description: describeRenewal(plan),
      paymentMethodId: subscription.savedCardId,
      idempotenceKey: renewalIdempotenceKey({
        userId: subscription.userId,
        currentPeriodEnd: subscription.currentPeriodEnd
      })
    });

    await this.checkout.recordPendingPayment({
      userId: subscription.userId,
      paymentId: payment.id,
      plan,
      isAutoCharge: true
    });

    if (payment.status === 'succeeded') {
      await this.webhook.settlePayment(payment.id);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          gt: new Date(),
          lt: addHours(new Date(), RENEW_WINDOW_HOURS)
        }
      },
      select: { userId: true, savedCardId: true, plan: true, currentPeriodEnd: true }
    });

    for (const subscription of due) {
      try {
        await this.chargeIfDue(subscription);
      } catch (error) {
        this.logger.warn(
          `Recurring charge failed for ${subscription.userId}: ${describeError(error)}`
        );
      }
    }
  }
}
