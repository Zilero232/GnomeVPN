import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { BillingSharedService } from './billing-shared.service';

@Injectable()
export class AutoRenewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: BillingSharedService,
  ) {}

  async cancelAutoRenew(userId: string): Promise<void> {
    await this.shared.setAutoRenew(userId, false);
  }

  async resumeAutoRenew(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { savedCardId: true },
    });

    if (!subscription?.savedCardId) {
      throw new AppBadRequestException('PAYMENT_METHOD_MISSING', 'No saved payment method');
    }

    await this.shared.setAutoRenew(userId, true);
  }
}
