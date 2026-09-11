import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { map, pipe, unique } from 'remeda';

import type { OwnersOfInput, SweepInput } from './expired-access.job.types';

import { PrismaService } from '../../../../core';
import { ConfigAccessService } from '../../../configs';
import { SessionAccessService } from '../../../sessions';
import { CONFIG_GRACE_HOURS } from '../../config';
import { activeSince, lapsedBefore } from '../../lib';

@Injectable()
export class ExpiredAccessJob {
  private readonly logger = new Logger(ExpiredAccessJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionAccessService,
    private readonly configs: ConfigAccessService
  ) {}

  private async ownersOf({ kind, user, state }: OwnersOfInput): Promise<string[]> {
    const peers = await this.prisma.peer.findMany({
      where: { kind, user, ...(state ? { state } : {}) },
      select: { userId: true }
    });

    return pipe(
      peers,
      map((peer) => peer.userId),
      unique()
    );
  }

  private async sweep({ kind, user, state, act }: SweepInput): Promise<string[]> {
    const owners = await this.ownersOf({ kind, user, state });

    await Promise.allSettled(owners.map((userId) => act(userId)));

    return owners;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const now = new Date();

    const [sessions, configs, restored] = await Promise.all([
      this.sweep({
        kind: 'session',
        user: lapsedBefore(now),
        act: (userId) => this.sessions.disconnectAll(userId)
      }),
      this.sweep({
        kind: 'config',
        user: lapsedBefore(subHours(now, CONFIG_GRACE_HOURS)),
        act: (userId) => this.configs.setEnabledAll({ userId, enabled: false })
      }),
      this.sweep({
        kind: 'config',
        user: activeSince(now),
        state: 'disabled',
        act: (userId) => this.configs.setEnabledAll({ userId, enabled: true })
      })
    ]);

    if (sessions.length > 0 || configs.length > 0) {
      this.logger.log(`Revoked access: ${sessions.length} session(s), ${configs.length} config owner(s)`);
    }

    if (restored.length > 0) {
      this.logger.log(`Restored access for ${restored.length} config owner(s)`);
    }
  }
}
