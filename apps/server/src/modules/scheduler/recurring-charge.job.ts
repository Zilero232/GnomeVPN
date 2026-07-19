import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';
import { YooKassaClient } from '../../lib';

const RENEW_WINDOW_MS = 24 * 3_600_000;
const DESCRIPTION = 'Продление подписки Vesper';

@Injectable()
export class RecurringChargeJob {
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

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { lt: new Date(Date.now() + RENEW_WINDOW_MS) },
      },
      select: { userId: true, yookassaPaymentMethodId: true },
    });

    const price = this.config.get('SUBSCRIPTION_PRICE_RUB');

    for (const subscription of due) {
      if (!subscription.yookassaPaymentMethodId) {
        continue;
      }

      try {
        const payment = await this.makeClient().chargeRecurring({
          amountRub: price,
          description: DESCRIPTION,
          paymentMethodId: subscription.yookassaPaymentMethodId,
          idempotenceKey: randomUUID(),
        });

        await this.prisma.payment.create({
          data: {
            userId: subscription.userId,
            yookassaPaymentId: payment.id,
            amount: price,
            status: 'pending',
            isRecurring: true,
          },
        });
      } catch {
        await this.prisma.subscription.update({
          where: { userId: subscription.userId },
          data: { status: 'expired' },
        });
      }
    }
  }
}
