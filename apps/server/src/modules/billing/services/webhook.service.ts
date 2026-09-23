import type { WebhookEvent } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { SettledPayment } from '../billing.types';

import { describeError } from '../../../common/lib';
import { PrismaService, withSerializableRetry } from '../../../core';
import { YooKassaClient } from '../../../lib';
import { SubscriptionAccessService } from '../../subscription-link';
import { TelegramNotifyService } from '../../telegram/services/telegram-notify.service';
import { BillingSharedService } from './billing-shared.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly shared: BillingSharedService,
    private readonly access: SubscriptionAccessService,
    private readonly notify: TelegramNotifyService
  ) {}

  async handleWebhook(event: WebhookEvent): Promise<void> {
    if (event.event === 'payment_method.active') {
      await this.handlePaymentMethodActive(event.object.id);

      return;
    }

    await this.settlePayment(event.object.id);
  }

  async settlePayment(paymentId: string): Promise<void> {
    const row = await this.prisma.payment.findUnique({
      where: { yookassaPaymentId: paymentId },
      select: {
        id: true,
        userId: true,
        status: true,
        plan: true,
        kind: true,
        extraDevices: true,
        isAutoCharge: true,
        amount: true
      }
    });

    if (isNullish(row)) {
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
        data: { status: 'canceled' }
      });

      this.logger.log(`payment ${paymentId} was canceled`);

      return;
    }

    if (payment.status !== 'succeeded') {
      this.logger.debug(`payment ${paymentId} is still ${payment.status}`);

      return;
    }

    const settled = await withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const claimed = await tx.payment.updateMany({
            where: { id: row.id, status: 'pending' },
            data: { status: 'succeeded' }
          });

          if (claimed.count === 0) {
            this.logger.debug(`payment ${paymentId} was claimed by a concurrent webhook`);

            return false;
          }

          if (row.kind === 'extraDevices') {
            await this.shared.grantExtraDevices({ userId: row.userId, quantity: row.extraDevices, db: tx });

            return true;
          }

          await this.shared.activate({
            userId: row.userId,
            planId: row.plan,
            method: payment.paymentMethodId ? { id: payment.paymentMethodId, title: payment.paymentMethodTitle } : null,
            db: tx
          });

          return true;
        },
        { isolationLevel: 'Serializable' }
      )
    );

    if (!settled) {
      return;
    }

    await this.access.setEnabledAll({ userId: row.userId, enabled: true }).catch((error: unknown) => {
      this.logger.error(`paid access for ${row.userId} was not re-enabled, the sweep will retry: ${describeError(error)}`);
    });

    await this.announce(row);
  }

  private async announce({ userId, kind, isAutoCharge, amount }: SettledPayment): Promise<void> {
    if (kind === 'extraDevices') {
      await this.notify.tell({ userId, pick: (copy) => copy.devicesAdded });

      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { currentPeriodEnd: true }
    });

    const date = subscription?.currentPeriodEnd;

    if (isAutoCharge) {
      await this.notify.tell({ userId, pick: (copy) => copy.renewed, date, fill: { amount: String(amount) } });

      return;
    }

    await this.notify.tell({ userId, pick: (copy) => copy.paid, date });
  }

  private async handlePaymentMethodActive(paymentMethodId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { pendingCardId: paymentMethodId },
      select: { userId: true }
    });

    if (isNullish(subscription)) {
      return;
    }

    const method = await this.yookassa.getPaymentMethod(paymentMethodId);

    if (method.status !== 'active') {
      await this.prisma.subscription.update({
        where: { userId: subscription.userId },
        data: { pendingCardId: null }
      });

      return;
    }

    await this.shared.attachPaymentMethod({
      userId: subscription.userId,
      paymentMethodId,
      title: method.title
    });
  }
}
