import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { addMonths, isAfter } from 'date-fns';

import { AppBadRequestException } from '../../common/exceptions';
import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';
import { YooKassaClient } from '../../lib';

import type { CheckoutResult, WebhookEvent } from '@gnomevpn/schemas';

const DESCRIPTION = 'Подписка GnomeVPN на 1 месяц';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  makeClient(): YooKassaClient {
    return new YooKassaClient({
      shopId: this.config.get('YOOKASSA_SHOP_ID'),
      secretKey: this.config.get('YOOKASSA_SECRET_KEY'),
    });
  }

  private priceRub(): number {
    return this.config.get('SUBSCRIPTION_PRICE_RUB');
  }

  async createCheckout(userId: string): Promise<CheckoutResult> {
    const price = this.priceRub();

    const payment = await this.makeClient().createPayment({
      amountRub: price,
      description: DESCRIPTION,
      returnUrl: this.config.get('YOOKASSA_RETURN_URL'),
      idempotenceKey: randomUUID(),
      savePaymentMethod: true,
    });

    await this.prisma.payment.create({
      data: {
        userId,
        yookassaPaymentId: payment.id,
        amount: price,
        status: 'pending',
        isRecurring: false,
      },
    });

    if (!payment.confirmationUrl) {
      throw new AppBadRequestException('PAYMENT_FAILED', 'Не удалось создать платёж');
    }

    return { confirmationUrl: payment.confirmationUrl };
  }

  private async activate(userId: string, paymentMethodId: string | null): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { currentPeriodEnd: true },
    });

    const now = new Date();
    const current = subscription?.currentPeriodEnd;
    const base = current && isAfter(current, now) ? current : now;

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'active',
        currentPeriodEnd: addMonths(base, 1),
        ...(paymentMethodId ? { yookassaPaymentMethodId: paymentMethodId } : {}),
      },
    });
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    const row = await this.prisma.payment.findUnique({
      where: { yookassaPaymentId: event.object.id },
      select: { id: true, userId: true, status: true },
    });

    if (!row || row.status === 'succeeded') {
      return;
    }

    const payment = await this.makeClient().getPayment(event.object.id);

    if (payment.status !== 'succeeded') {
      return;
    }

    await this.prisma.payment.update({
      where: { id: row.id },
      data: { status: 'succeeded' },
    });

    await this.activate(row.userId, payment.paymentMethodId);
  }

  async cancelAutoRenew(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }
}
