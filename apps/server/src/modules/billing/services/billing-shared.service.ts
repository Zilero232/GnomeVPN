import type { CheckoutClient } from '@gnomevpn/schemas';

import { findPlan, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import type {
  ActivateInput,
  AttachMethodInput,
  AutoRenewInput,
  GrantExtraDevicesInput,
  PrismaExecutor
} from '../billing.types';

import { isPeriodActive, nextPeriodEnd } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';

@Injectable()
export class BillingSharedService {
  private readonly logger = new Logger(BillingSharedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
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
      data: { cancelAtPeriodEnd: !isEnabled }
    });
  }

  async attachPaymentMethod({ userId, paymentMethodId, title }: AttachMethodInput): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        savedCardId: paymentMethodId,
        savedCardTitle: title,
        pendingCardId: null,
        cancelAtPeriodEnd: false
      }
    });
  }

  private resolveCancelAtPeriodEnd({ hasMethod, wasCancelled }: AutoRenewInput): boolean {
    if (!this.isRecurringEnabled() || !hasMethod) {
      return true;
    }

    return wasCancelled;
  }

  async activate(
    { userId, planId, method }: ActivateInput,
    db: PrismaExecutor = this.prisma
  ): Promise<void> {
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        savedCardId: true
      }
    });

    const plan = findPlan(planId);
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    const paidPlan = isPeriodActive(currentPeriodEnd) ? (subscription?.plan ?? plan.id) : plan.id;

    const data = {
      plan: paidPlan,
      currentPeriodEnd: nextPeriodEnd({ currentPeriodEnd, months: plan.months }),
      cancelAtPeriodEnd: this.resolveCancelAtPeriodEnd({
        hasMethod: Boolean(method?.id ?? subscription?.savedCardId),
        wasCancelled: subscription?.cancelAtPeriodEnd ?? false
      }),
      ...(method?.id ? { savedCardId: method.id, savedCardTitle: method.title } : {})
    };

    await db.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }

  async grantExtraDevices(
    { userId, quantity }: GrantExtraDevicesInput,
    db: PrismaExecutor = this.prisma
  ): Promise<void> {
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { extraDevices: true }
    });

    if (!subscription) {
      this.logger.warn(`paid extra devices for ${userId} without a subscription row`);

      return;
    }

    const granted = Math.min(subscription.extraDevices + quantity, MAX_EXTRA_DEVICES);
    const dropped = subscription.extraDevices + quantity - granted;

    if (dropped > 0) {
      this.logger.error(
        `extra-devices overflow for ${userId}: paid ${quantity}, granted ${granted - subscription.extraDevices}, ${dropped} dropped over MAX ${MAX_EXTRA_DEVICES} — manual review needed`
      );
    }

    await db.subscription.update({
      where: { userId },
      data: { extraDevices: granted }
    });
  }
}
