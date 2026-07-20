import { randomUUID } from 'node:crypto';
import { findPlan } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../common/exceptions';
import { isPeriodActive, nextPeriodEnd } from '../../common/lib';
import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';
import { makeYooKassaClient, YooKassaClient } from '../../lib';
import { describePlan } from './lib';

import type { BindCardResult, CheckoutResult, PlanId, WebhookEvent } from '@gnomevpn/schemas';
import type { ActivateInput, AttachMethodInput, AutoRenewInput } from './billing.types';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private makeClient(): YooKassaClient {
    return makeYooKassaClient(this.config);
  }

  private isRecurringEnabled(): boolean {
    return this.config.get('YOOKASSA_RECURRING');
  }

  async createCheckout(userId: string, planId: PlanId): Promise<CheckoutResult> {
    const plan = findPlan(planId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, currentPeriodEnd: true },
    });

    if (
      subscription?.status === 'active' &&
      isPeriodActive(subscription.currentPeriodEnd) &&
      subscription.plan !== plan.id
    ) {
      throw new AppBadRequestException(
        'PLAN_CHANGE_LOCKED',
        'Plan cannot change while the current period runs',
      );
    }

    const payment = await this.makeClient().createPayment({
      amountRub: plan.priceRub,
      description: describePlan(plan),
      returnUrl: this.config.get('YOOKASSA_RETURN_URL'),
      idempotenceKey: randomUUID(),
      savePaymentMethod: this.isRecurringEnabled(),
    });

    await this.prisma.payment.create({
      data: {
        userId,
        yookassaPaymentId: payment.id,
        amount: plan.priceRub,
        status: 'pending',
        isRecurring: false,
        plan: plan.id,
      },
    });

    if (!payment.confirmationUrl) {
      throw new AppBadRequestException('PAYMENT_FAILED', 'YooKassa returned no confirmation URL');
    }

    return { confirmationUrl: payment.confirmationUrl };
  }

  private resolveAutoRenew({ hasMethod, wasCancelled }: AutoRenewInput): boolean {
    if (!this.isRecurringEnabled() || !hasMethod) {
      return true;
    }

    return wasCancelled;
  }

  private async activate({ userId, planId, method }: ActivateInput): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        yookassaPaymentMethodId: true,
      },
    });

    const plan = findPlan(planId);
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    const paidPlan = isPeriodActive(currentPeriodEnd) ? (subscription?.plan ?? plan.id) : plan.id;

    const data = {
      status: 'active' as const,
      plan: paidPlan,
      currentPeriodEnd: nextPeriodEnd({ currentPeriodEnd, months: plan.months }),
      cancelAtPeriodEnd: this.resolveAutoRenew({
        hasMethod: Boolean(method?.id ?? subscription?.yookassaPaymentMethodId),
        wasCancelled: subscription?.cancelAtPeriodEnd ?? false,
      }),
      ...(method?.id
        ? { yookassaPaymentMethodId: method.id, paymentMethodTitle: method.title }
        : {}),
    };

    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    if (event.event === 'payment_method.active') {
      await this.handlePaymentMethodActive(event.object.id);

      return;
    }

    await this.handlePaymentEvent(event.object.id);
  }

  private async handlePaymentEvent(paymentId: string): Promise<void> {
    const row = await this.prisma.payment.findUnique({
      where: { yookassaPaymentId: paymentId },
      select: { id: true, userId: true, status: true, plan: true },
    });

    if (row?.status !== 'pending') {
      return;
    }

    const payment = await this.makeClient().getPayment(paymentId);

    if (payment.status === 'canceled') {
      await this.prisma.payment.update({
        where: { id: row.id },
        data: { status: 'canceled' },
      });

      return;
    }

    if (payment.status !== 'succeeded') {
      return;
    }

    const claimed = await this.prisma.payment.updateMany({
      where: { id: row.id, status: 'pending' },
      data: { status: 'succeeded' },
    });

    if (claimed.count === 0) {
      return;
    }

    await this.activate({
      userId: row.userId,
      planId: row.plan,
      method: payment.paymentMethodId
        ? { id: payment.paymentMethodId, title: payment.paymentMethodTitle }
        : null,
    });
  }

  private async setAutoRenew(userId: string, isEnabled: boolean): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: !isEnabled },
    });
  }

  async cancelAutoRenew(userId: string): Promise<void> {
    await this.setAutoRenew(userId, false);
  }

  async resumeAutoRenew(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { yookassaPaymentMethodId: true },
    });

    if (!subscription?.yookassaPaymentMethodId) {
      throw new AppBadRequestException('PAYMENT_METHOD_MISSING', 'No saved payment method');
    }

    await this.setAutoRenew(userId, true);
  }

  async bindCard(userId: string): Promise<BindCardResult> {
    if (!this.isRecurringEnabled()) {
      throw new AppBadRequestException(
        'RECURRING_UNAVAILABLE',
        'Recurring payments are not enabled for this shop',
      );
    }

    const method = await this.makeClient().bindPaymentMethod({
      returnUrl: this.config.get('YOOKASSA_RETURN_URL'),
      idempotenceKey: randomUUID(),
    });

    if (method.status === 'active') {
      await this.attachPaymentMethod({
        userId,
        paymentMethodId: method.id,
        title: method.title,
      });

      return { confirmationUrl: null, isActive: true };
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { pendingPaymentMethodId: method.id },
    });

    return { confirmationUrl: method.confirmationUrl, isActive: false };
  }

  private async attachPaymentMethod({
    userId,
    paymentMethodId,
    title,
  }: AttachMethodInput): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        yookassaPaymentMethodId: paymentMethodId,
        paymentMethodTitle: title,
        pendingPaymentMethodId: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  async unbindCard(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        yookassaPaymentMethodId: null,
        paymentMethodTitle: null,
        pendingPaymentMethodId: null,
        cancelAtPeriodEnd: true,
      },
    });
  }

  private async handlePaymentMethodActive(paymentMethodId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { pendingPaymentMethodId: paymentMethodId },
      select: { userId: true },
    });

    if (!subscription) {
      return;
    }

    const method = await this.makeClient().getPaymentMethod(paymentMethodId);

    if (method.status !== 'active') {
      await this.prisma.subscription.update({
        where: { userId: subscription.userId },
        data: { pendingPaymentMethodId: null },
      });

      return;
    }

    await this.attachPaymentMethod({
      userId: subscription.userId,
      paymentMethodId,
      title: method.title,
    });
  }
}
