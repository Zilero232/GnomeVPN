import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { resolveNodeApiKey } from '../../common/lib';
import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';
import { NodesService } from '../nodes';

import type { TunnelConfig } from '@gnomevpn/schemas';

const ALLOWED_IPS = ['0.0.0.0/0', '::/0'];
const KEEPALIVE = 25;

@Injectable()
export class TunnelService {
  private readonly logger = new Logger(TunnelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
  ) {}

  private makeWgClient(baseUrl: string, apiKeyRef: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey: resolveNodeApiKey(apiKeyRef) });
  }

  // Best effort: a node that is unreachable or missing its key must not fail
  // the caller, or a country switch would break on the node being left behind.
  private async releasePeer(nodeId: string, wgEasyClientId: string): Promise<void> {
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      select: { wgEasyUrl: true, wgEasyApiKeyRef: true },
    });

    if (!node) {
      return;
    }

    try {
      await this.makeWgClient(node.wgEasyUrl, node.wgEasyApiKeyRef).deleteClient(wgEasyClientId);
    } catch (error) {
      this.logger.warn(`Failed to release peer ${wgEasyClientId}: ${String(error)}`);
    }
  }

  async connect(userId: string, nodeId: string): Promise<TunnelConfig> {
    const node = await this.nodes.getNodeForConnect(nodeId);
    const wg = this.makeWgClient(node.wgEasyUrl, node.wgEasyApiKeyRef);

    const existing = await this.prisma.activePeer.findUnique({ where: { userId } });

    let created: Awaited<ReturnType<WgEasyClient['createClient']>>;

    try {
      created = await wg.createClient(userId);
    } catch {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wg-easy node unreachable');
    }

    // The row is claimed before the old peer is removed: if this fails the user
    // keeps a working tunnel, and the new client is rolled back. Removing first
    // would leave them with nothing.
    try {
      await this.prisma.activePeer.upsert({
        where: { userId },
        create: {
          userId,
          nodeId,
          wgEasyClientId: created.clientId,
          assignedIp: created.address,
        },
        update: {
          nodeId,
          wgEasyClientId: created.clientId,
          assignedIp: created.address,
        },
      });
    } catch (error) {
      await wg.deleteClient(created.clientId).catch(() => undefined);
      throw error;
    }

    if (existing) {
      await this.releasePeer(existing.nodeId, existing.wgEasyClientId);
    }

    return {
      privateKey: created.privateKey,
      address: created.address,
      dns: created.dns,
      serverPublicKey: created.serverPublicKey,
      presharedKey: created.presharedKey,
      endpoint: node.publicEndpoint,
      allowedIps: ALLOWED_IPS,
      persistentKeepalive: KEEPALIVE,
    };
  }

  async disconnect(userId: string): Promise<void> {
    const existing = await this.prisma.activePeer.findUnique({ where: { userId } });

    if (!existing) {
      return;
    }

    await this.releasePeer(existing.nodeId, existing.wgEasyClientId);

    await this.prisma.activePeer.delete({ where: { userId } });
  }
}
