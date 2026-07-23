import { randomUUID } from 'node:crypto';
import { extraDevicesPriceRub, findPlan, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { isPeriodActive } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { YooKassaClient } from '../../../lib';
import { describeExtraDevices, describePlan } from '../lib';
import { BillingSharedService } from './billing-shared.service';

import type { CheckoutClient, CheckoutResult, PlanId } from '@gnomevpn/schemas';
import type { BuyExtraDevicesServiceInput, RecordPaymentInput } from '../billing.types';

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

  async buyExtraDevices({
    userId,
    quantity,
    client,
  }: BuyExtraDevicesServiceInput): Promise<CheckoutResult> {
    const [subscription, pending] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { userId },
        select: { extraDevices: true, currentPeriodEnd: true },
      }),
      this.prisma.payment.aggregate({
        where: { userId, kind: 'extraDevices', status: 'pending' },
        _sum: { extraDevices: true },
      }),
    ]);

    if (!isPeriodActive(subscription?.currentPeriodEnd)) {
      throw new AppBadRequestException(
        'SUBSCRIPTION_REQUIRED',
        'Extra devices need an active subscription',
      );
    }

    const claimed = (subscription?.extraDevices ?? 0) + (pending._sum.extraDevices ?? 0);

    if (claimed + quantity > MAX_EXTRA_DEVICES) {
      throw new AppBadRequestException(
        'EXTRA_DEVICES_LIMIT',
        `At most ${MAX_EXTRA_DEVICES} extra devices`,
      );
    }

    const payment = await this.yookassa.createPayment({
      amountRub: extraDevicesPriceRub(quantity),
      description: describeExtraDevices(quantity),
      returnUrl: this.shared.returnUrlFor(client),
      idempotenceKey: randomUUID(),
      savePaymentMethod: false,
    });

    if (!payment.confirmationUrl) {
      throw new AppBadRequestException('PAYMENT_FAILED', 'YooKassa returned no confirmation URL');
    }

    await this.prisma.payment.create({
      data: {
        userId,
        yookassaPaymentId: payment.id,
        amount: extraDevicesPriceRub(quantity),
        status: 'pending',
        isAutoCharge: false,
        kind: 'extraDevices',
        extraDevices: quantity,
      },
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
