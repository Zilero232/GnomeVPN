import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { map, pipe, unique } from 'remeda';

import { PrismaService } from '../../../core';
import { TunnelService } from '../../tunnel';
import { CONFIG_GRACE_HOURS } from '../config';
import { lapsedBefore } from '../lib';

@Injectable()
export class ExpiredAccessJob {
  private readonly logger = new Logger(ExpiredAccessJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tunnel: TunnelService,
  ) {}

  private async revokeExpiredSessions(): Promise<string[]> {
    const peers = await this.prisma.peer.findMany({
      where: { kind: 'session', user: lapsedBefore(new Date()) },
      select: { userId: true },
    });

    const expired = map(peers, (peer) => peer.userId);

    await Promise.allSettled(expired.map((userId) => this.tunnel.disconnect(userId)));

    return expired;
  }

  private async revokeExpiredConfigs(): Promise<string[]> {
    const configs = await this.prisma.peer.findMany({
      where: {
        kind: 'config',
        user: lapsedBefore(subHours(new Date(), CONFIG_GRACE_HOURS)),
      },
      select: { userId: true },
    });

    const expired = pipe(
      configs,
      map((config) => config.userId),
      unique(),
    );

    await Promise.allSettled(expired.map((userId) => this.tunnel.revokeAllConfigs(userId)));

    return expired;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const [sessions, configs] = await Promise.all([
      this.revokeExpiredSessions(),
      this.revokeExpiredConfigs(),
    ]);

    if (sessions.length > 0 || configs.length > 0) {
      this.logger.log(
        `Revoked access: ${sessions.length} session(s), ${configs.length} config owner(s)`,
      );
    }
  }
}
