import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService } from '../../peers';
import { SubscriptionService } from '../../subscription';
import { SessionAccessService } from './session-access.service';

import type { DeviceUsage, TunnelConfig } from '@gnomevpn/schemas';
import type {
  ConnectSessionInput,
  DisconnectSessionInput,
  HeartbeatSessionInput,
} from '../sessions.service.types';

@Injectable()
export class SessionConnectService {
  private readonly logger = new Logger(SessionConnectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
    private readonly access: SessionAccessService,
    private readonly subscription: SubscriptionService,
  ) {}

  private async freeSlot({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [sessions, { deviceLimit }] = await Promise.all([
      this.prisma.peer.findMany({
        where: { userId, kind: 'session' },
        orderBy: [{ lastActiveAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
        select: PEER_REF_SELECT,
      }),
      this.subscription.getLimits(userId),
    ]);

    if (sessions.some((peer) => peer.name === deviceId) || sessions.length < deviceLimit) {
      return;
    }

    const evicted = sessions.slice(0, sessions.length - deviceLimit + 1);

    this.logger.log(
      `evicting ${evicted.length} least-recently-used slot(s) for ${userId}/${deviceId}`,
    );

    await this.access.releaseAll(evicted);
  }

  async listDevices({ userId, deviceId }: DisconnectSessionInput): Promise<DeviceUsage> {
    const [rows, { deviceLimit }] = await Promise.all([
      this.prisma.peer.findMany({
        where: { userId, kind: 'session' },
        orderBy: [{ lastActiveAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        select: {
          name: true,
          lastActiveAt: true,
          node: { select: { country: true } },
        },
      }),
      this.subscription.getLimits(userId),
    ]);

    return {
      used: rows.length,
      limit: deviceLimit,
      devices: rows.map((row) => ({
        name: row.name ?? '',
        country: row.node.country,
        lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
        isCurrent: row.name === deviceId,
      })),
    };
  }

  async connect({ userId, nodeId, deviceId }: ConnectSessionInput): Promise<TunnelConfig> {
    this.logger.log(`connect requested by ${userId}/${deviceId} for node ${nodeId}`);

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

    this.logger.log(`connect granted to ${userId}/${deviceId} on ${node.country} (${node.host})`);

    return buildTunnelConfig({ node, auth: created.xrayUserId });
  }

  async disconnect({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [session] = await this.peers.findRefs({ userId, kind: 'session', name: deviceId });

    if (!session) {
      return;
    }

    await this.access.releaseAll([session]);
  }

  async heartbeat({ userId, deviceId }: HeartbeatSessionInput): Promise<void> {
    await this.prisma.peer.updateMany({
      where: { userId, kind: 'session', name: deviceId },
      data: { lastActiveAt: new Date() },
    });
  }
}
