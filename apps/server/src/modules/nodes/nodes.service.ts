import { Injectable } from '@nestjs/common';

import { AppNotFoundException } from '../../common/exceptions';
import { PrismaService } from '../../core';

import type { Node } from '@vesper/schemas';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicNodes(): Promise<Node[]> {
    const rows = await this.prisma.node.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, country: true, countryCode: true, flagEmoji: true, city: true },
    });

    return rows.map((r) => ({
      id: r.id,
      country: r.country,
      countryCode: r.countryCode,
      flagEmoji: r.flagEmoji,
      city: r.city ?? undefined,
    }));
  }

  async getNodeForConnect(nodeId: string) {
    const node = await this.prisma.node.findFirst({
      where: { id: nodeId, enabled: true },
      select: { id: true, publicEndpoint: true, wgEasyUrl: true, wgEasyApiKeyRef: true },
    });

    if (!node) {
      throw new AppNotFoundException('NODE_NOT_FOUND', 'Node not found');
    }

    return node;
  }
}
