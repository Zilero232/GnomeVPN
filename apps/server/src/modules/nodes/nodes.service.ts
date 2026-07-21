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
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        country: true,
        countryCode: true,
        city: true,
        isAvailable: true,
        lastHealthyAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      country: r.country,
      countryCode: r.countryCode,
      city: r.city ?? undefined,
      status: resolveNodeStatus({ isAvailable: r.isAvailable, lastHealthyAt: r.lastHealthyAt }),
      lastHealthyAt: r.lastHealthyAt ? r.lastHealthyAt.toISOString() : null,
    }));
  }

  async getNodeForConnect(nodeId: string) {
    const node = await this.prisma.node.findFirst({
      where: { id: nodeId, isAvailable: true },
      select: {
        id: true,
        country: true,
        countryCode: true,
        host: true,
        port: true,
        realityServerName: true,
        realityPublicKey: true,
        realityShortId: true,
        apiUrl: true,
        apiTokenEnvVar: true,
        isAvailable: true,
        lastHealthyAt: true,
      },
    });

    if (!node) {
      throw new AppNotFoundException('NODE_NOT_FOUND', 'Node not found');
    }

    if (
      resolveNodeStatus({ isAvailable: node.isAvailable, lastHealthyAt: node.lastHealthyAt }) !==
      'online'
    ) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node is not healthy');
    }

    return node;
  }
}
