import { findPlan } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, differenceInHours } from 'date-fns';

import type { NotifyInput } from '../../../telegram/telegram.types';
import type { EndingSubscription } from './period-reminder.job.types';

import { describeError } from '../../../../common/lib';
import { AppConfigService } from '../../../../config';
import { PrismaService } from '../../../../core';
import { trialState } from '../../../subscription';
import { TelegramNotifyService } from '../../../telegram/services/telegram-notify.service';
import { WINDOW } from '../../config';

@Injectable()
export class PeriodReminderJob {
  private readonly logger = new Logger(PeriodReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notify: TelegramNotifyService
  ) {}

  private reminderFor(subscription: EndingSubscription): NotifyInput | null {
    const { userId, currentPeriodEnd } = subscription;
    const hoursLeft = differenceInHours(currentPeriodEnd, new Date());

    if (trialState(subscription).isTrial) {
      return hoursLeft < WINDOW.trialRemindHours ? { userId, pick: (copy) => copy.trialEndingSoon } : null;
    }

    const willCharge = !subscription.cancelAtPeriodEnd && subscription.savedCardId !== null && this.config.get('YOOKASSA_RECURRING');

    if (!willCharge) {
      return { userId, pick: (copy) => copy.endingSoon, date: currentPeriodEnd };
    }

    if (hoursLeft < WINDOW.renewHours) {
      return null;
    }

    const fill = { amount: String(findPlan(subscription.plan).priceRub), card: subscription.savedCardTitle ?? '****' };

    return { userId, pick: (copy) => copy.renewSoon, date: currentPeriodEnd, fill };
  }

  private async remind(subscription: EndingSubscription): Promise<void> {
    const reminder = this.reminderFor(subscription);

    if (!reminder) {
      return;
    }

    const claimed = await this.prisma.subscription.updateMany({
      where: { id: subscription.id, reminderSentFor: subscription.reminderSentFor },
      data: { reminderSentFor: subscription.currentPeriodEnd }
    });

    if (claimed.count === 0) {
      return;
    }

    await this.notify.tell(reminder);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const now = new Date();

    const ending = await this.prisma.subscription.findMany({
      where: { currentPeriodEnd: { gt: now, lt: addHours(now, WINDOW.remindHours) } },
      select: {
        id: true,
        userId: true,
        plan: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        savedCardId: true,
        savedCardTitle: true,
        trialStartedAt: true,
        reminderSentFor: true
      }
    });

    const unreminded = ending.filter(
      (row): row is EndingSubscription => row.currentPeriodEnd !== null && row.reminderSentFor?.getTime() !== row.currentPeriodEnd.getTime()
    );

    for (const subscription of unreminded) {
      try {
        await this.remind(subscription);
      } catch (error) {
        this.logger.warn(`Period reminder failed for ${subscription.userId}: ${describeError(error)}`);
      }
    }
  }
}
