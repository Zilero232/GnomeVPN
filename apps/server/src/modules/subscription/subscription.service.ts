import { DEFAULT_PLAN_ID } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { isPeriodActive } from '../../common/lib';
import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';

import type { SubscriptionStatus } from '@gnomevpn/schemas';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async hasActiveAccess(userId: string): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    return row?.status === 'active' && isPeriodActive(row.currentPeriodEnd);
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const isRecurringAvailable = this.config.get('YOOKASSA_RECURRING');

    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        yookassaPaymentMethodId: true,
        paymentMethodTitle: true,
      },
    });

    if (!row) {
      return {
        status: 'expired',
        plan: DEFAULT_PLAN_ID,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasPaymentMethod: false,
        paymentMethodTitle: null,
        isRecurringAvailable,
      };
    }

    return {
      status: row.status,
      plan: row.plan,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      hasPaymentMethod: row.yookassaPaymentMethodId !== null,
      paymentMethodTitle: row.paymentMethodTitle,
      isRecurringAvailable,
    };
  }
}
