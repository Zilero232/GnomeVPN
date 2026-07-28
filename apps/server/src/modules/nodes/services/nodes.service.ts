import { Injectable, Logger } from '@nestjs/common';

import { AppNotFoundException, AppServiceUnavailableException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { resolveNodeStatus } from '../lib';

import type { Node, NodeEndpoint } from '@gnomevpn/schemas';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);

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

  async listEndpoints(): Promise<NodeEndpoint[]> {
    const rows = await this.prisma.node.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, host: true, port: true, serverName: true },
    });

    return rows.map((r) => ({
      id: r.id,
      host: r.host,
      port: r.port,
      serverName: r.serverName,
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
        serverName: true,
        apiUrl: true,
        apiTokenEnvVar: true,
        wgPublicKey: true,
        isAvailable: true,
        lastHealthyAt: true,
      },
    });

    if (!node) {
      this.logger.warn(`node ${nodeId} not found or disabled`);

      throw new AppNotFoundException('NODE_NOT_FOUND', 'Node not found');
    }

    const status = resolveNodeStatus({
      isAvailable: node.isAvailable,
      lastHealthyAt: node.lastHealthyAt,
    });

    if (status !== 'online') {
      this.logger.warn(
        `node ${node.country} (${node.host}) is ${status}, last healthy at ${node.lastHealthyAt?.toISOString() ?? 'never'}`,
      );

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node is not healthy');
    }

    return node;
  }
}
