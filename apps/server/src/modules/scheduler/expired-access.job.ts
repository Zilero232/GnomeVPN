import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../core';
import { TunnelService } from '../tunnel/tunnel.service';

type PeerAccessRow = {
  userId: string;
  user: {
    subscription: { status: string; currentPeriodEnd: Date | null } | null;
  };
};

@Injectable()
export class ExpiredAccessJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tunnel: TunnelService,
  ) {}

  private hasAccess(row: PeerAccessRow): boolean {
    const subscription = row.user.subscription;

    if (subscription?.status !== 'active' || !subscription.currentPeriodEnd) {
      return false;
    }

    return subscription.currentPeriodEnd.getTime() > Date.now();
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

    const expired = peers.filter((peer) => !this.hasAccess(peer));

    await Promise.allSettled(expired.map((peer) => this.tunnel.disconnect(peer.userId)));
  }
}
