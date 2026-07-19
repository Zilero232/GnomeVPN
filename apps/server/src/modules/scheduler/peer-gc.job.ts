import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';

const STALE_MS = 5 * 60_000;

type PeerRow = {
  id: string;
  wgEasyClientId: string;
  createdAt: Date;
  lastHandshakeAt: Date | null;
  node: { wgEasyUrl: string; wgEasyApiKeyRef: string };
};

@Injectable()
export class PeerGcJob {
  constructor(private readonly prisma: PrismaService) {}

  makeClient(baseUrl: string, apiKey: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey });
  }

  private isStale(createdAt: Date, handshake: Date | null): boolean {
    const last = handshake ?? createdAt;

    return Date.now() - last.getTime() > STALE_MS;
  }

  private async collect(peer: PeerRow): Promise<void> {
    const apiKey = process.env[peer.node.wgEasyApiKeyRef];

    if (!apiKey) {
      return;
    }

    const wg = this.makeClient(peer.node.wgEasyUrl, apiKey);
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

    await Promise.allSettled(peers.map((peer) => this.collect(peer)));
  }
}
