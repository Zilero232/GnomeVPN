import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { filter, map, pipe } from 'remeda';

import { isPeriodActive } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { TunnelService } from '../../tunnel';

import type { PeerAccessRow } from './jobs.types';

@Injectable()
export class ExpiredAccessJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tunnel: TunnelService,
  ) {}

  private hasAccess(row: PeerAccessRow): boolean {
    const subscription = row.user.subscription;

    return subscription?.status === 'active' && isPeriodActive(subscription.currentPeriodEnd);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const peers = await this.prisma.activePeer.findMany({
      select: {
        userId: true,
        user: {
          select: {
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });

    await Promise.allSettled(
      pipe(
        peers,
        filter((peer) => !this.hasAccess(peer)),
        map((peer) => this.tunnel.disconnect(peer.userId)),
      ),
    );
  }
}
