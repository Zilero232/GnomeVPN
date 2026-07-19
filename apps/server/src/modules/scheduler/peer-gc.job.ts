import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';

const STALE_MS = 15 * 60_000;

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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    const peers = await this.prisma.activePeer.findMany({
      select: {
        id: true,
        wgEasyClientId: true,
        createdAt: true,
        node: { select: { wgEasyUrl: true, wgEasyApiKeyRef: true } },
      },
    });

    for (const peer of peers) {
      const apiKey = process.env[peer.node.wgEasyApiKeyRef];

      if (!apiKey) {
        continue;
      }

      const wg = this.makeClient(peer.node.wgEasyUrl, apiKey);
      const handshake = await wg.getClientHandshake(peer.wgEasyClientId);

      if (!this.isStale(peer.createdAt, handshake)) {
        continue;
      }

      await wg.deleteClient(peer.wgEasyClientId).catch(() => undefined);
      await this.prisma.activePeer.delete({ where: { id: peer.id } });
    }
  }
}
