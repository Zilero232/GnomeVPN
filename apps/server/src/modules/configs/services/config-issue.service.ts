import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PeersService } from '../../peers';
import { CONFIG_LIMIT } from '../config';
import { configFileName, renderConfigFile } from '../lib';

import type { DownloadedConfig } from '@gnomevpn/schemas';
import type { ConfigFile, IssueConfigInput } from '../configs.service.types';

@Injectable()
export class ConfigIssueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
  ) {}

  async list(userId: string): Promise<DownloadedConfig[]> {
    const rows = await this.prisma.peer.findMany({
      where: { userId, kind: 'config' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        nodeId: true,
        createdAt: true,
        node: { select: { country: true, countryCode: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? '',
      nodeId: row.nodeId,
      country: row.node.country,
      countryCode: row.node.countryCode,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async issue({ userId, nodeId, name }: IssueConfigInput): Promise<ConfigFile> {
    const node = await this.nodes.getNodeForConnect(nodeId);

    const existing = await this.prisma.peer.findFirst({
      where: { userId, kind: 'config', name: { equals: name, mode: 'insensitive' } },
    });

    const count = await this.prisma.peer.count({ where: { userId, kind: 'config' } });

    if (!existing && count >= CONFIG_LIMIT) {
      throw new AppBadRequestException('CONFIG_LIMIT_REACHED', `At most ${CONFIG_LIMIT} configs`);
    }

    const created = await this.peers.issue({ node, userId, kind: 'config', name });

    try {
      await (existing
        ? this.prisma.peer.update({
            where: { id: existing.id },
            data: { nodeId, xrayUserId: created.xrayUserId },
          })
        : this.prisma.peer.create({
            data: { userId, nodeId, kind: 'config', name, xrayUserId: created.xrayUserId },
          }));
    } catch (error) {
      await this.peers.discard({ node, email: created.email });

      throw error;
    }

    return {
      fileName: `${configFileName({ countryCode: node.countryCode, deviceName: name })}.txt`,
      content: renderConfigFile({
        deviceName: name,
        country: node.country,
        config: buildTunnelConfig({ node, auth: created.xrayUserId }),
      }),
    };
  }
}
