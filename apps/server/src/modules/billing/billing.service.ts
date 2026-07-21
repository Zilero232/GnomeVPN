import { randomUUID } from 'node:crypto';
import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import { AppBadRequestException } from '../../common/exceptions';
import { describeError, isPeriodActive, nextPeriodEnd } from '../../common/lib';
import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';
import { YooKassaClient } from '../../lib';
import { describePlan } from './lib';

import type {
  BindCardResult,
  CheckoutClient,
  CheckoutResult,
  PlanId,
  WebhookEvent,
} from '@gnomevpn/schemas';
import type {
  ActivateInput,
  AttachMethodInput,
  AutoRenewInput,
  RecordPaymentInput,
} from './billing.types';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly yookassa: YooKassaClient,
  ) {}

  private isRecurringEnabled(): boolean {
    return this.config.get('YOOKASSA_RECURRING');
  }

  private returnUrlFor(client: CheckoutClient): string {
    return client === 'desktop'
      ? this.config.get('YOOKASSA_RETURN_URL_DESKTOP')
      : this.config.get('YOOKASSA_RETURN_URL');
  }

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
      returnUrl: this.returnUrlFor(client),
      idempotenceKey: randomUUID(),
      savePaymentMethod: this.isRecurringEnabled(),
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
        savedCardId: true,
      },
    });

    const plan = findPlan(planId);
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    const paidPlan = isPeriodActive(currentPeriodEnd) ? (subscription?.plan ?? plan.id) : plan.id;

    const data = {
      plan: paidPlan,
      currentPeriodEnd: nextPeriodEnd({ currentPeriodEnd, months: plan.months }),
      cancelAtPeriodEnd: this.resolveAutoRenew({
        hasMethod: Boolean(method?.id ?? subscription?.savedCardId),
        wasCancelled: subscription?.cancelAtPeriodEnd ?? false,
      }),
      ...(method?.id ? { savedCardId: method.id, savedCardTitle: method.title } : {}),
    };

    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  // Any status other than 2xx makes YooKassa retry for a day, so a failure here
  // is logged and swallowed rather than surfaced.
  async handleWebhook(event: WebhookEvent): Promise<void> {
    try {
      if (event.event === 'payment_method.active') {
        await this.handlePaymentMethodActive(event.object.id);

        return;
      }

      await this.handlePaymentEvent(event.object.id);
    } catch (error) {
      this.logger.error(`webhook ${event.event} failed: ${describeError(error)}`);
    }
  }

  private async handlePaymentEvent(paymentId: string): Promise<void> {
    const row = await this.prisma.payment.findUnique({
      where: { yookassaPaymentId: paymentId },
      select: { id: true, userId: true, status: true, plan: true },
    });

    if (!row) {
      this.logger.warn(`webhook for an unknown payment ${paymentId}`);

      return;
    }

    if (row.status !== 'pending') {
      this.logger.debug(`payment ${paymentId} is already ${row.status}`);

      return;
    }

    const payment = await this.yookassa.getPayment(paymentId);

    if (payment.status === 'canceled') {
      await this.prisma.payment.update({
        where: { id: row.id },
        data: { status: 'canceled' },
      });

      this.logger.log(`payment ${paymentId} was canceled`);

      return;
    }

    if (payment.status !== 'succeeded') {
      this.logger.debug(`payment ${paymentId} is still ${payment.status}`);

      return;
    }

    const claimed = await this.prisma.payment.updateMany({
      where: { id: row.id, status: 'pending' },
      data: { status: 'succeeded' },
    });

    if (claimed.count === 0) {
      this.logger.debug(`payment ${paymentId} was claimed by a concurrent webhook`);

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
      select: { savedCardId: true },
    });

    if (!subscription?.savedCardId) {
      throw new AppBadRequestException('PAYMENT_METHOD_MISSING', 'No saved payment method');
    }

    await this.setAutoRenew(userId, true);
  }

  async bindCard(userId: string, client: CheckoutClient): Promise<BindCardResult> {
    if (!this.isRecurringEnabled()) {
      throw new AppBadRequestException(
        'RECURRING_UNAVAILABLE',
        'Recurring payments are not enabled for this shop',
      );
    }

    const method = await this.yookassa.bindPaymentMethod({
      returnUrl: this.returnUrlFor(client),
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
      data: { pendingCardId: method.id },
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
        savedCardId: paymentMethodId,
        savedCardTitle: title,
        pendingCardId: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  async unbindCard(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        savedCardId: null,
        savedCardTitle: null,
        pendingCardId: null,
        cancelAtPeriodEnd: true,
      },
    });
  }

  private async handlePaymentMethodActive(paymentMethodId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { pendingCardId: paymentMethodId },
      select: { userId: true },
    });

    if (!subscription) {
      return;
    }

    const method = await this.yookassa.getPaymentMethod(paymentMethodId);

    if (method.status !== 'active') {
      await this.prisma.subscription.update({
        where: { userId: subscription.userId },
        data: { pendingCardId: null },
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
