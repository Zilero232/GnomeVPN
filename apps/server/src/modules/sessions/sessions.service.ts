import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core';
import { NodesService } from '../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService } from '../peers';
import { SESSION_LIMIT } from './config';

import type { TunnelConfig } from '@gnomevpn/schemas';
import type { PeerRef } from '../peers';
import type { ConnectSessionInput, DisconnectSessionInput } from './sessions.service.types';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
  ) {}

  // A subscription covers SESSION_LIMIT devices at once. A known device reuses
  // its slot; a new one past the limit evicts the least recently used, and the
  // eviction happens before the new client exists so the two never collide.
  private async freeSlot({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const sessions = await this.prisma.peer.findMany({
      where: { userId, kind: 'session' },
      select: PEER_REF_SELECT,
      orderBy: [{ lastActiveAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
    });

    if (sessions.some((peer) => peer.name === deviceId) || sessions.length < SESSION_LIMIT) {
      return;
    }

    await this.releaseAll(sessions.slice(0, sessions.length - SESSION_LIMIT + 1));
  }

  private async releaseAll(peers: PeerRef[]): Promise<void> {
    const { kept } = await this.peers.releaseMany(peers);

    if (kept > 0) {
      this.logger.warn(`Kept ${kept} session row(s): peers still live`);
    }
  }

  async connect({ userId, nodeId, deviceId }: ConnectSessionInput): Promise<TunnelConfig> {
    const node = await this.nodes.getNodeForConnect(nodeId);

    await this.freeSlot({ userId, deviceId });

    const created = await this.peers.issue({ node, userId, kind: 'session', name: deviceId });

    try {
      await this.prisma.peer.upsert({
        where: { userId_kind_name: { userId, kind: 'session', name: deviceId } },
        create: {
          userId,
          nodeId,
          kind: 'session',
          name: deviceId,
          xrayUserId: created.xrayUserId,
        },
        update: { nodeId, xrayUserId: created.xrayUserId, trafficBytes: 0n, lastActiveAt: null },
      });
    } catch (error) {
      await this.peers.discard({ node, email: created.email });

      throw error;
    }

    return buildTunnelConfig({ node, xrayUserId: created.xrayUserId });
  }

  async disconnect({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [session] = await this.peers.findRefs({ userId, kind: 'session', name: deviceId });

    if (!session) {
      return;
    }

    await this.releaseAll([session]);
  }

  async disconnectAll(userId: string): Promise<void> {
    await this.releaseAll(await this.peers.findRefs({ userId, kind: 'session' }));
  }
}
