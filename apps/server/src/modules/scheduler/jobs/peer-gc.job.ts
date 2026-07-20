import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBefore, subMilliseconds } from 'date-fns';

import { resolveNodeApiKey } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WgEasyClient } from '../../../lib';

import type { PeerRow } from './jobs.types';

const STALE_MS = 5 * 60_000;

// A peer that has never handshaked is not idle — the user may have fetched the
// config and not brought the tunnel up yet. Collecting it at STALE_MS revokes a
// config the client still believes is valid, and it fails with no error.
const NEVER_CONNECTED_GRACE_MS = 60 * 60_000;

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
      apiKey: resolveNodeApiKey(peer.node.wgEasyApiKeyRef),
    });

    const handshake = await wg.getClientHandshake(peer.wgEasyClientId);

    if (!this.isStale(peer.createdAt, handshake)) {
      if (handshake && handshake.getTime() !== peer.lastHandshakeAt?.getTime()) {
        await this.prisma.activePeer.update({
          where: { id: peer.id },
          data: { lastHandshakeAt: handshake },
        });
      }

      return;
    }

    await wg.deleteClient(peer.wgEasyClientId).catch(() => undefined);
    await this.prisma.activePeer.delete({ where: { id: peer.id } });
  }

  @Cron('*/2 * * * *')
  async run(): Promise<void> {
    const peers = await this.prisma.activePeer.findMany({
      select: {
        id: true,
        wgEasyClientId: true,
        createdAt: true,
        lastHandshakeAt: true,
        node: { select: { wgEasyUrl: true, wgEasyApiKeyRef: true } },
      },
    });

    const results = await Promise.allSettled(peers.map((peer) => this.collect(peer)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Peer collection failed: ${String(result.reason)}`);
      }
    }
  }
}
