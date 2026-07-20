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
        city: true,
        enabled: true,
        lastHealthyAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      country: r.country,
      countryCode: r.countryCode,
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
        country: true,
        countryCode: true,
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
      resolveNodeStatus({ enabled: node.enabled, lastHealthyAt: node.lastHealthyAt }) !== 'online'
    ) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node is not healthy');
    }

    return node;
  }
}
