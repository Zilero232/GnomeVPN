import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { YooKassaClient } from '../../../lib';
import { BillingSharedService } from './billing-shared.service';

import type { BindCardResult, CheckoutClient } from '@gnomevpn/schemas';

@Injectable()
export class CardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yookassa: YooKassaClient,
    private readonly shared: BillingSharedService,
  ) {}

  async bindCard(userId: string, client: CheckoutClient): Promise<BindCardResult> {
    if (!this.shared.isRecurringEnabled()) {
      throw new AppBadRequestException(
        'RECURRING_UNAVAILABLE',
        'Recurring payments are not enabled for this shop',
      );
    }

    const method = await this.yookassa.bindPaymentMethod({
      returnUrl: this.shared.returnUrlFor(client),
      idempotenceKey: randomUUID(),
    });

    if (method.status === 'active') {
      await this.shared.attachPaymentMethod({
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
}
