import type { SubscriptionStatus } from '@gnomevpn/schemas';

import { DEFAULT_PLAN_ID, isPlaceholderEmail, TRIAL_DAYS } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';
import { addDays } from 'date-fns';

import type { TrialEligibility, TrialStanding } from '../subscription.types';

import { AppBadRequestException } from '../../../common/exceptions';
import { isPeriodActive } from '../../../common/lib';
import { isPrismaRequestError, PrismaService, UNIQUE_VIOLATION } from '../../../core';
import { trialState } from '../lib';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class TrialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService
  ) {}

  async eligibility(userId: string): Promise<TrialEligibility> {
    const { eligibility } = await this.standing(userId);

    return eligibility;
  }

  async standing(userId: string): Promise<TrialStanding> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true, subscription: { select: { currentPeriodEnd: true, trialStartedAt: true } } }
    });

    const hasAccess = isPeriodActive(user?.subscription?.currentPeriodEnd);

    if (!user || (!user.emailVerified && !isPlaceholderEmail(user.email))) {
      return { eligibility: 'emailUnverified', hasAccess };
    }

    return { eligibility: trialState(user.subscription).isTrialAvailable ? 'available' : 'used', hasAccess };
  }

  async claim(userId: string): Promise<SubscriptionStatus> {
    const eligibility = await this.eligibility(userId);

    if (eligibility === 'emailUnverified') {
      throw new AppBadRequestException('TRIAL_EMAIL_UNVERIFIED', 'Confirm your email address before starting a trial');
    }

    if (eligibility === 'used') {
      throw new AppBadRequestException('TRIAL_ALREADY_USED', 'This account has already had its trial');
    }

    await this.grant(userId);

    return this.subscription.getStatus(userId);
  }

  private async grant(userId: string): Promise<void> {
    const startedAt = new Date();
    const period = { trialStartedAt: startedAt, currentPeriodEnd: addDays(startedAt, TRIAL_DAYS) };

    const updated = await this.prisma.subscription.updateMany({
      where: { userId, trialStartedAt: null, currentPeriodEnd: null },
      data: period
    });

    if (updated.count > 0) {
      return;
    }

    try {
      await this.prisma.subscription.create({ data: { userId, plan: DEFAULT_PLAN_ID, ...period } });
    } catch (error) {
      if (isPrismaRequestError(error) && error.code === UNIQUE_VIOLATION) {
        return;
      }

      throw error;
    }
  }
}
