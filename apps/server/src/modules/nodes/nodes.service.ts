import { Injectable } from '@nestjs/common';

import { AppNotFoundException, AppServiceUnavailableException } from '../../common/exceptions';
import { PrismaService } from '../../core';
import { resolveNodeStatus } from './lib';

import type { Node } from '@gnomevpn/schemas';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicNodes(): Promise<Node[]> {
    const rows = await this.prisma.node.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        country: true,
        countryCode: true,
        flagEmoji: true,
        city: true,
        enabled: true,
        lastHealthyAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      country: r.country,
      countryCode: r.countryCode,
      flagEmoji: r.flagEmoji,
      city: r.city ?? undefined,
      status: resolveNodeStatus({ enabled: r.enabled, lastHealthyAt: r.lastHealthyAt }),
      lastHealthyAt: r.lastHealthyAt ? r.lastHealthyAt.toISOString() : null,
    }));
  }

  async getNodeForConnect(nodeId: string) {
    const node = await this.prisma.node.findFirst({
      where: { id: nodeId, enabled: true },
      select: {
        id: true,
        publicEndpoint: true,
        wgEasyUrl: true,
        wgEasyApiKeyRef: true,
        enabled: true,
        lastHealthyAt: true,
      },
    });

    if (!node) {
      throw new AppNotFoundException('NODE_NOT_FOUND', 'Node not found');
    }

    if (
      resolveNodeStatus({ enabled: node.enabled, lastHealthyAt: node.lastHealthyAt }) === 'offline'
    ) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node is offline');
    }

    return node;
  }

  async markHealth(nodeId: string, isHealthy: boolean): Promise<void> {
    if (!isHealthy) {
      return;
    }

    await this.prisma.node.update({
      where: { id: nodeId },
      data: { lastHealthyAt: new Date() },
    });
  }
}
