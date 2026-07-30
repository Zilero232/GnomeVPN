import type { DeviceUsage, TunnelConfig } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';

import type {
  ConnectSessionInput,
  DisconnectSessionInput,
  PersistSessionInput
} from '../sessions.service.types';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService, withSerializableRetry } from '../../../core';
import { EventsService } from '../../events';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService, peerWgData } from '../../peers';
import { SubscriptionService } from '../../subscription';
import { SessionAccessService } from './session-access.service';

@Injectable()
export class SessionConnectService {
  private readonly logger = new Logger(SessionConnectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
    private readonly access: SessionAccessService,
    private readonly subscription: SubscriptionService,
    private readonly events: EventsService
  ) {}

  private async freeSlot({ userId, deviceId }: DisconnectSessionInput): Promise<number> {
    const [sessions, { deviceLimit }] = await Promise.all([
      this.prisma.peer.findMany({
        where: { userId, kind: 'session', state: 'active' },
        orderBy: { createdAt: 'asc' },
        select: PEER_REF_SELECT
      }),
      this.subscription.getLimits(userId)
    ]);

    if (sessions.some((peer) => peer.name === deviceId) || sessions.length < deviceLimit) {
      return deviceLimit;
    }

    const online = await this.peers.onlinePeerIds(sessions);
    const idle = sessions.filter((peer) => !online.has(peer.id));
    const toFree = sessions.length - deviceLimit + 1;

    if (idle.length < toFree) {
      throw new AppBadRequestException(
        'DEVICE_LIMIT_REACHED',
        'All device slots are in active use'
      );
    }

    const evicted = idle.slice(0, toFree);
    this.logger.log(`evicting ${evicted.length} idle slot(s) for ${userId}/${deviceId}`);

    await this.access.releaseAll(evicted);

    return deviceLimit;
  }

  async listDevices({ userId, deviceId }: DisconnectSessionInput): Promise<DeviceUsage> {
    const [rows, { deviceLimit }] = await Promise.all([
      this.prisma.peer.findMany({
        where: { userId, kind: 'session', state: { not: 'revoked' } },
        orderBy: { createdAt: 'desc' },
        select: { ...PEER_REF_SELECT, node: { select: { country: true } } }
      }),
      this.subscription.getLimits(userId)
    ]);

    const online = await this.peers.onlinePeerIds(rows);
    const devices = rows.map((row) => ({
      name: row.name ?? '',
      country: row.node.country,
      isOnline: online.has(row.id),
      isCurrent: row.name === deviceId
    }));

    return {
      used: devices.filter((device) => device.isOnline).length,
      limit: deviceLimit,
      devices
    };
  }

  async connect({
    userId,
    nodeId,
    deviceId,
    protocol
  }: ConnectSessionInput): Promise<TunnelConfig> {
    this.logger.log(`connect requested by ${userId}/${deviceId} for node ${nodeId}`);

    const node = await this.nodes.getNodeForConnect(nodeId);

    const deviceLimit = await this.freeSlot({ userId, deviceId });

    const created = await this.peers.issueAndPersist({
      node,
      nodeId,
      userId,
      kind: 'session',
      protocol,
      name: deviceId,
      persist: (peer) =>
        this.persistSession({ userId, nodeId, deviceId, protocol, peer, deviceLimit })
    });

    this.logger.log(`connect granted to ${userId}/${deviceId} on ${node.country} (${node.host})`);

    this.events.publish(userId, { type: 'devices-changed' });

    return buildTunnelConfig({
      node,
      protocol,
      auth: created.nodeCredential,
      wgPrivateKey: created.wgPrivateKey,
      wgAssignedIp: created.wgAssignedIp
    });
  }

  private persistSession({
    userId,
    nodeId,
    deviceId,
    protocol,
    peer,
    deviceLimit
  }: PersistSessionInput): Promise<void> {
    const data = {
      nodeId,
      protocol,
      nodeCredential: peer.nodeCredential,
      ...peerWgData(peer)
    };

    return withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.peer.findFirst({
            where: { userId, kind: 'session', name: deviceId },
            select: { id: true }
          });

          if (existing) {
            await tx.peer.update({
              where: { id: existing.id },
              data: { ...data, state: 'active' }
            });

            return;
          }

          const active = await tx.peer.count({
            where: { userId, kind: 'session', state: 'active' }
          });

          if (active >= deviceLimit) {
            throw new AppBadRequestException(
              'DEVICE_LIMIT_REACHED',
              'All device slots are in active use'
            );
          }

          await tx.peer.create({ data: { userId, kind: 'session', name: deviceId, ...data } });
        },
        { isolationLevel: 'Serializable' }
      )
    );
  }

  async disconnect({ userId, deviceId }: DisconnectSessionInput): Promise<void> {
    const [session] = await this.peers.findRefs({ userId, kind: 'session', name: deviceId });

    if (session) {
      await this.access.releaseAll([session]);
    }

    this.events.publish(userId, { type: 'devices-changed' });
  }
}
