import type { WebhookEvent } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService, withSerializableRetry } from '../../../core';
import { YooKassaClient } from '../../../lib';
import { ConfigAccessService } from '../../configs';
import { BillingSharedService } from './billing-shared.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly shared: BillingSharedService,
    private readonly configs: ConfigAccessService
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
        extraDevices: true
      }
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
        data: { status: 'canceled' }
      });

      this.logger.log(`payment ${paymentId} was canceled`);

      return;
    }

    if (payment.status !== 'succeeded') {
      this.logger.debug(`payment ${paymentId} is still ${payment.status}`);

      return;
    }

    const activated = await withSerializableRetry(() =>
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
            await this.shared.grantExtraDevices({ userId: row.userId, quantity: row.extraDevices }, tx);

            return false;
          }

          await this.shared.activate(
            {
              userId: row.userId,
              planId: row.plan,
              method: payment.paymentMethodId ? { id: payment.paymentMethodId, title: payment.paymentMethodTitle } : null
            },
            tx
          );

          return true;
        },
        { isolationLevel: 'Serializable' }
      )
    );

    if (activated) {
      await this.configs.setEnabledAll({ userId: row.userId, enabled: true });
    }
  }

  private async handlePaymentMethodActive(paymentMethodId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { pendingCardId: paymentMethodId },
      select: { userId: true }
    });

    if (!subscription) {
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
