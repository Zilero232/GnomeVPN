import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService } from '../../peers';
import { SESSION_LIMIT } from '../config';
import { SessionAccessService } from './session-access.service';

import type { TunnelConfig } from '@gnomevpn/schemas';
import type { ConnectSessionInput, DisconnectSessionInput } from '../sessions.service.types';

@Injectable()
export class SessionConnectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
    private readonly access: SessionAccessService,
  ) {}

  private async freeSlot({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const sessions = await this.prisma.peer.findMany({
      where: { userId, kind: 'session' },
      select: PEER_REF_SELECT,
      orderBy: [{ lastActiveAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
    });

    if (sessions.some((peer) => peer.name === deviceId) || sessions.length < SESSION_LIMIT) {
      return;
    }

    await this.access.releaseAll(sessions.slice(0, sessions.length - SESSION_LIMIT + 1));
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

    return buildTunnelConfig({ node, auth: created.xrayUserId });
  }

  async disconnect({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [session] = await this.peers.findRefs({ userId, kind: 'session', name: deviceId });

    if (!session) {
      return;
    }

    await this.access.releaseAll([session]);
  }
}
