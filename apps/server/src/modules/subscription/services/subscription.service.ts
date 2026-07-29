import type { Limits, SubscriptionStatus } from '@gnomevpn/schemas';

import { DEFAULT_PLAN_ID, resolveLimits } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import { isPeriodActive, resolveStatus } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  async hasActiveAccess(userId: string): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { currentPeriodEnd: true }
    });

    return isPeriodActive(row?.currentPeriodEnd);
  }

  async getLimits(userId: string): Promise<Limits> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { extraDevices: true, currentPeriodEnd: true }
    });

    return resolveLimits(isPeriodActive(row?.currentPeriodEnd) ? row?.extraDevices : 0);
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const isRecurringAvailable = this.config.get('YOOKASSA_RECURRING');

    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        savedCardId: true,
        savedCardTitle: true,
        extraDevices: true
      }
    });

    if (!row) {
      return {
        status: 'expired',
        plan: DEFAULT_PLAN_ID,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasPaymentMethod: false,
        savedCardTitle: null,
        isRecurringAvailable,
        limits: resolveLimits(0)
      };
    }

    return {
      status: resolveStatus(row.currentPeriodEnd),
      plan: row.plan,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      hasPaymentMethod: isNonNullish(row.savedCardId),
      savedCardTitle: row.savedCardTitle,
      isRecurringAvailable,
      limits: resolveLimits(isPeriodActive(row.currentPeriodEnd) ? row.extraDevices : 0)
    };
  }
}
