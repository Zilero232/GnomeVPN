import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { map, pipe, unique } from 'remeda';

import { PrismaService } from '../../../../core';
import { ConfigAccessService } from '../../../configs';
import { EventsService } from '../../../events';
import { SessionAccessService } from '../../../sessions';
import { CONFIG_GRACE_HOURS } from '../../config';
import { lapsedBefore } from '../../lib';

@Injectable()
export class ExpiredAccessJob {
  private readonly logger = new Logger(ExpiredAccessJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionAccessService,
    private readonly configs: ConfigAccessService,
    private readonly events: EventsService
  ) {}

  private async revokeExpiredSessions(): Promise<string[]> {
    const peers = await this.prisma.peer.findMany({
      where: { kind: 'session', user: lapsedBefore(new Date()) },
      select: { userId: true }
    });

    const expired = pipe(
      peers,
      map((peer) => peer.userId),
      unique()
    );

    await Promise.allSettled(expired.map((userId) => this.sessions.disconnectAll(userId)));

    for (const userId of expired) {
      this.events.publish(userId, { type: 'devices-changed' });
    }

    return expired;
  }

  private async revokeExpiredConfigs(): Promise<string[]> {
    const configs = await this.prisma.peer.findMany({
      where: {
        kind: 'config',
        user: lapsedBefore(subHours(new Date(), CONFIG_GRACE_HOURS))
      },
      select: { userId: true }
    });

    const expired = pipe(
      configs,
      map((config) => config.userId),
      unique()
    );

    await Promise.allSettled(
      expired.map((userId) => this.configs.setEnabledAll({ userId, enabled: false }))
    );

    return expired;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const [sessions, configs] = await Promise.all([
      this.revokeExpiredSessions(),
      this.revokeExpiredConfigs()
    ]);

    if (sessions.length > 0 || configs.length > 0) {
      this.logger.log(
        `Revoked access: ${sessions.length} session(s), ${configs.length} config owner(s)`
      );
    }
  }
}
