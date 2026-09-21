import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { isEmpty, map, pipe, unique } from 'remeda';

import type { OwnersOfInput, SweepInput } from './expired-access.job.types';

import { describeError } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { SubscriptionAccessService } from '../../../subscription-link';
import { WINDOW } from '../../config';
import { activeSince, lapsedBefore } from '../../lib';

@Injectable()
export class ExpiredAccessJob {
  private readonly logger = new Logger(ExpiredAccessJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SubscriptionAccessService
  ) {}

  private async ownersOf({ user, state }: OwnersOfInput): Promise<string[]> {
    const peers = await this.prisma.peer.findMany({
      where: { kind: 'config', user, ...(state ? { state } : {}) },
      select: { userId: true }
    });

    return pipe(
      peers,
      map((peer) => peer.userId),
      unique()
    );
  }

  private async sweep({ user, state, act }: SweepInput): Promise<string[]> {
    const owners = await this.ownersOf({ user, state });

    const results = await Promise.allSettled(owners.map((userId) => act(userId)));

    const failed = results.filter((result) => result.status === 'rejected');

    for (const result of failed) {
      this.logger.error(`sweeping a subscriber failed: ${describeError(result.reason)}`);
    }

    return owners.filter((_, index) => results[index].status === 'fulfilled');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const now = new Date();

    const [disabled, restored] = await Promise.all([
      this.sweep({
        user: lapsedBefore(subHours(now, WINDOW.configGraceHours)),
        act: (userId) => this.access.setEnabledAll({ userId, enabled: false })
      }),
      this.sweep({
        user: activeSince(now),
        state: 'disabled',
        act: (userId) => this.access.setEnabledAll({ userId, enabled: true })
      })
    ]);

    if (!isEmpty(disabled)) {
      this.logger.log(`Disabled access for ${disabled.length} subscriber(s)`);
    }

    if (!isEmpty(restored)) {
      this.logger.log(`Restored access for ${restored.length} subscriber(s)`);
    }
  }
}
