import { Injectable } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';
import { NodesService } from '../nodes/nodes.service';

import type { TunnelConfig } from '@vesper/schemas';

const ALLOWED_IPS = ['0.0.0.0/0', '::/0'];
const KEEPALIVE = 25;

@Injectable()
export class TunnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
  ) {}

  makeWgClient(baseUrl: string, apiKey: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey });
  }

  private resolveApiKey(ref: string): string {
    const key = process.env[ref];

    if (!key) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node credentials missing');
    }

    return key;
  }

  async connect(userId: string, nodeId: string): Promise<TunnelConfig> {
    const node = await this.nodes.getNodeForConnect(nodeId);
    const apiKey = this.resolveApiKey(node.wgEasyApiKeyRef);
    const wg = this.makeWgClient(node.wgEasyUrl, apiKey);

    const existing = await this.prisma.activePeer.findUnique({ where: { userId } });

    let created: Awaited<ReturnType<WgEasyClient['createClient']>>;

    try {
      created = await wg.createClient(userId);
    } catch {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wg-easy node unreachable');
    }

    if (existing) {
      const oldNode = await this.prisma.node.findUnique({
        where: { id: existing.nodeId },
        select: { wgEasyUrl: true, wgEasyApiKeyRef: true },
      });

      if (oldNode) {
        const oldWg = this.makeWgClient(
          oldNode.wgEasyUrl,
          this.resolveApiKey(oldNode.wgEasyApiKeyRef),
        );
        await oldWg.deleteClient(existing.wgEasyClientId).catch(() => undefined);
      }
    }

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

    return {
      privateKey: created.privateKey,
      address: created.address,
      dns: created.dns,
      serverPublicKey: created.serverPublicKey,
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

    const node = await this.prisma.node.findUnique({
      where: { id: existing.nodeId },
      select: { wgEasyUrl: true, wgEasyApiKeyRef: true },
    });

    if (node) {
      const wg = this.makeWgClient(node.wgEasyUrl, this.resolveApiKey(node.wgEasyApiKeyRef));
      await wg.deleteClient(existing.wgEasyClientId).catch(() => undefined);
    }

    await this.prisma.activePeer.delete({ where: { userId } });
  }
}
