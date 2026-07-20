import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBefore, subMilliseconds } from 'date-fns';

import { describeError, resolveNodeApiKey } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WgEasyClient } from '../../../lib';
import { NEVER_CONNECTED_GRACE_MS, STALE_MS } from '../config';

import type { PeerRow } from './jobs.types';

@Injectable()
export class PeerGcJob {
  private readonly logger = new Logger(PeerGcJob.name);

  constructor(private readonly prisma: PrismaService) {}

  private isStale(createdAt: Date, handshake: Date | null): boolean {
    if (!handshake) {
      return isBefore(createdAt, subMilliseconds(new Date(), NEVER_CONNECTED_GRACE_MS));
    }

    return isBefore(handshake, subMilliseconds(new Date(), STALE_MS));
  }

  private async collect(peer: PeerRow): Promise<void> {
    const wg = new WgEasyClient({
      baseUrl: peer.node.wgEasyUrl,
      apiKey: resolveNodeApiKey(peer.node.wgEasyApiKeyEnvVar),
    });

    const handshake = await wg.getClientHandshake(peer.wgEasyClientId);

    if (!this.isStale(peer.createdAt, handshake)) {
      if (handshake && handshake.getTime() !== peer.lastHandshakeAt?.getTime()) {
        await this.prisma.peer.updateMany({
          where: { id: peer.id },
          data: { lastHandshakeAt: handshake },
        });
      }

      return;
    }

    await wg.deleteClient(peer.wgEasyClientId).catch(() => undefined);

    await this.prisma.peer.deleteMany({ where: { id: peer.id } });
  }

  @Cron('*/2 * * * *')
  async run(): Promise<void> {
    const peers = await this.prisma.peer.findMany({
      where: { kind: 'session' },
      select: {
        id: true,
        wgEasyClientId: true,
        createdAt: true,
        lastHandshakeAt: true,
        node: { select: { wgEasyUrl: true, wgEasyApiKeyEnvVar: true } },
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
