import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core';

import type { SubscriptionStatus } from '@vesper/schemas';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveAccess(_userId: string): Promise<boolean> {
    return true;
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    if (!row) {
      return { status: 'expired', currentPeriodEnd: null };
    }

    return {
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    };
  }
}
