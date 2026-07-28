import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core';
import { EventsService } from '../../events';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService, peerWgData } from '../../peers';
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
    private readonly events: EventsService,
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

  async connect({
    userId,
    nodeId,
    deviceId,
    protocol,
  }: ConnectSessionInput): Promise<TunnelConfig> {
    this.logger.log(`connect requested by ${userId}/${deviceId} for node ${nodeId}`);

    const node = await this.nodes.getNodeForConnect(nodeId);

    await this.freeSlot({ userId, deviceId });

    const created = await this.peers.issueAndPersist({
      node,
      nodeId,
      userId,
      kind: 'session',
      protocol,
      name: deviceId,
      persist: async (peer) => {
        const existing = await this.prisma.peer.findFirst({
          where: { userId, kind: 'session', name: deviceId },
          select: { id: true },
        });

        const data = {
          nodeId,
          protocol,
          nodeCredential: peer.nodeCredential,
          ...peerWgData(peer),
        };

        if (existing) {
          await this.prisma.peer.update({
            where: { id: existing.id },
            data: { ...data, trafficBytes: 0n, lastActiveAt: null },
          });

          return;
        }

        await this.prisma.peer.create({
          data: { userId, kind: 'session', name: deviceId, ...data },
        });
      },
    });

    this.logger.log(`connect granted to ${userId}/${deviceId} on ${node.country} (${node.host})`);

    this.events.publish(userId, { type: 'devices-changed' });

    return buildTunnelConfig({
      node,
      protocol,
      auth: created.nodeCredential,
      wgPrivateKey: created.wgPrivateKey,
      wgAssignedIp: created.wgAssignedIp,
    });
  }

  async disconnect({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [session] = await this.peers.findRefs({ userId, kind: 'session', name: deviceId });

    if (session) {
      await this.access.releaseAll([session]);
    }

    this.events.publish(userId, { type: 'devices-changed' });
  }

  async heartbeat({ userId, deviceId }: HeartbeatSessionInput): Promise<void> {
    await this.prisma.peer.updateMany({
      where: { userId, kind: 'session', name: deviceId },
      data: { lastActiveAt: new Date() },
    });
  }
}
