import { findPlan, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import { isPeriodActive, nextPeriodEnd } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';

import type { CheckoutClient } from '@gnomevpn/schemas';
import type {
  ActivateInput,
  AttachMethodInput,
  AutoRenewInput,
  GrantExtraDevicesInput,
} from '../billing.types';

@Injectable()
export class BillingSharedService {
  private readonly logger = new Logger(BillingSharedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  isRecurringEnabled(): boolean {
    return this.config.get('YOOKASSA_RECURRING');
  }

  returnUrlFor(client: CheckoutClient): string {
    return client === 'desktop'
      ? this.config.get('YOOKASSA_RETURN_URL_DESKTOP')
      : this.config.get('YOOKASSA_RETURN_URL');
  }

  async setAutoRenew(userId: string, isEnabled: boolean): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: !isEnabled },
    });
  }

  async attachPaymentMethod({ userId, paymentMethodId, title }: AttachMethodInput): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        savedCardId: paymentMethodId,
        savedCardTitle: title,
        pendingCardId: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  private resolveAutoRenew({ hasMethod, wasCancelled }: AutoRenewInput): boolean {
    if (!this.isRecurringEnabled() || !hasMethod) {
      return true;
    }

    return wasCancelled;
  }

  async activate({ userId, planId, method }: ActivateInput): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        savedCardId: true,
      },
    });

    const plan = findPlan(planId);
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    const paidPlan = isPeriodActive(currentPeriodEnd) ? (subscription?.plan ?? plan.id) : plan.id;

    const data = {
      plan: paidPlan,
      currentPeriodEnd: nextPeriodEnd({ currentPeriodEnd, months: plan.months }),
      cancelAtPeriodEnd: this.resolveAutoRenew({
        hasMethod: Boolean(method?.id ?? subscription?.savedCardId),
        wasCancelled: subscription?.cancelAtPeriodEnd ?? false,
      }),
      ...(method?.id ? { savedCardId: method.id, savedCardTitle: method.title } : {}),
    };

    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async grantExtraDevices({ userId, quantity }: GrantExtraDevicesInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { userId },
        select: { extraDevices: true },
      });

      if (!subscription) {
        this.logger.warn(`paid extra devices for ${userId} without a subscription row`);

        return;
      }

      await tx.subscription.update({
        where: { userId },
        data: {
          extraDevices: Math.min(subscription.extraDevices + quantity, MAX_EXTRA_DEVICES),
        },
      });
    });
  }
}
