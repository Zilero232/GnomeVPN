import { randomUUID } from 'node:crypto';
import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, subHours } from 'date-fns';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';
import { makeYooKassaClient, YooKassaClient } from '../../../lib';
import { describeRenewal } from '../../billing';
import { IN_FLIGHT_WINDOW_HOURS, RENEW_WINDOW_HOURS } from '../config';

import type { DueSubscription } from './jobs.types';

@Injectable()
export class RecurringChargeJob {
  private readonly logger = new Logger(RecurringChargeJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private makeClient(): YooKassaClient {
    return makeYooKassaClient(this.config);
  }

  private async hasChargeInFlight(userId: string): Promise<boolean> {
    const pending = await this.prisma.payment.findFirst({
      where: {
        userId,
        isAutoCharge: true,
        status: 'pending',
        createdAt: { gt: subHours(new Date(), IN_FLIGHT_WINDOW_HOURS) },
      },
      select: { id: true },
    });

    return pending !== null;
  }

  private async charge(subscription: DueSubscription): Promise<void> {
    if (!subscription.savedCardId) {
      return;
    }

    if (await this.hasChargeInFlight(subscription.userId)) {
      return;
    }

    const plan = findPlan(subscription.plan);

    const payment = await this.makeClient().chargeRecurring({
      amountRub: plan.priceRub,
      description: describeRenewal(plan),
      paymentMethodId: subscription.savedCardId,
      idempotenceKey: randomUUID(),
    });

    await this.prisma.payment.create({
      data: {
        userId: subscription.userId,
        yookassaPaymentId: payment.id,
        amount: plan.priceRub,
        status: 'pending',
        isAutoCharge: true,
        plan: plan.id,
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          gt: new Date(),
          lt: addHours(new Date(), RENEW_WINDOW_HOURS),
        },
      },
      select: { userId: true, savedCardId: true, plan: true },
    });

    for (const subscription of due) {
      try {
        await this.charge(subscription);
      } catch (error) {
        this.logger.warn(
          `Recurring charge failed for ${subscription.userId}: ${describeError(error)}`,
        );
      }
    }
  }
}
