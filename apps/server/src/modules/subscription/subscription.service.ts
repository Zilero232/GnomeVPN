import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core';

import type { SubscriptionStatus } from '@vesper/schemas';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveAccess(userId: string): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    if (row?.status !== 'active' || !row.currentPeriodEnd) {
      return false;
    }

    return row.currentPeriodEnd.getTime() > Date.now();
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    });

    if (!row) {
      return { status: 'expired', currentPeriodEnd: null, cancelAtPeriodEnd: false };
    }

    return {
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    };
  }
}
