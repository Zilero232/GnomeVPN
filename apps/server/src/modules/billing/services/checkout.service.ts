import { randomUUID } from 'node:crypto';
import { findPlan } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { isPeriodActive } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { YooKassaClient } from '../../../lib';
import { describePlan } from '../lib';
import { BillingSharedService } from './billing-shared.service';

import type { CheckoutClient, CheckoutResult, PlanId } from '@gnomevpn/schemas';
import type { RecordPaymentInput } from '../billing.types';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly shared: BillingSharedService,
  ) {}

  async createCheckout(
    userId: string,
    planId: PlanId,
    client: CheckoutClient,
  ): Promise<CheckoutResult> {
    const plan = findPlan(planId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, currentPeriodEnd: true },
    });

    if (isPeriodActive(subscription?.currentPeriodEnd) && subscription?.plan !== plan.id) {
      throw new AppBadRequestException(
        'PLAN_CHANGE_LOCKED',
        'Plan cannot change while the current period runs',
      );
    }

    const payment = await this.yookassa.createPayment({
      amountRub: plan.priceRub,
      description: describePlan(plan),
      returnUrl: this.shared.returnUrlFor(client),
      idempotenceKey: randomUUID(),
      savePaymentMethod: this.shared.isRecurringEnabled(),
    });

    if (!payment.confirmationUrl) {
      throw new AppBadRequestException('PAYMENT_FAILED', 'YooKassa returned no confirmation URL');
    }

    await this.recordPendingPayment({
      userId,
      paymentId: payment.id,
      plan,
      isAutoCharge: false,
    });

    return { confirmationUrl: payment.confirmationUrl };
  }

  async recordPendingPayment({
    userId,
    paymentId,
    plan,
    isAutoCharge,
  }: RecordPaymentInput): Promise<void> {
    await this.prisma.payment.create({
      data: {
        userId,
        yookassaPaymentId: paymentId,
        amount: plan.priceRub,
        status: 'pending',
        isAutoCharge,
        plan: plan.id,
      },
    });
  }
}
