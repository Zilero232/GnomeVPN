import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBefore, subMilliseconds } from 'date-fns';

import { describeError, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { EventsService } from '../../../events';
import { peerClientName } from '../../../peers';
import { BOOT_GRACE_MS, NEVER_CONNECTED_GRACE_MS, STALE_MS } from '../../config';

import type { PeerRow } from './peer-gc.job.types';

@Injectable()
export class PeerGcJob {
  private readonly logger = new Logger(PeerGcJob.name);
  private readonly bootedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  private isStale({ createdAt, lastActiveAt }: PeerRow): boolean {
    if (!lastActiveAt) {
      return isBefore(createdAt, subMilliseconds(new Date(), NEVER_CONNECTED_GRACE_MS));
    }

    return isBefore(lastActiveAt, subMilliseconds(new Date(), STALE_MS));
  }

  private async collect(peer: PeerRow): Promise<void> {
    const xray = xrayClientForNode(peer.node);

    const email = peerClientName({ userId: peer.userId, kind: 'session', name: peer.name });

    const traffic = await xray.getClientTraffic(email);

    if (traffic !== null && BigInt(traffic) !== peer.trafficBytes) {
      await this.prisma.peer.updateMany({
        where: { id: peer.id },
        data: { trafficBytes: BigInt(traffic), lastActiveAt: new Date() },
      });

      return;
    }

    if (!this.isStale(peer)) {
      return;
    }

    await xray.removePeer({ email });

    await this.prisma.peer.deleteMany({ where: { id: peer.id } });

    this.events.publish(peer.userId, { type: 'devices-changed' });
  }

  @Cron('*/2 * * * *')
  async run(): Promise<void> {
    if (Date.now() - this.bootedAt < BOOT_GRACE_MS) {
      return;
    }

    const peers = await this.prisma.peer.findMany({
      where: { kind: 'session' },
      select: {
        id: true,
        userId: true,
        name: true,
        protocol: true,
        createdAt: true,
        trafficBytes: true,
        lastActiveAt: true,
        node: { select: { apiUrl: true, apiTokenEnvVar: true } },
      },
    });

    const results = await Promise.allSettled(peers.map((peer) => this.collect(peer)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Peer collection failed: ${describeError(result.reason)}`);
      }
    }
  }
}
