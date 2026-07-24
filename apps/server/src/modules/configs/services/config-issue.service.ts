import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PeersService } from '../../peers';
import { SubscriptionService } from '../../subscription';
import { configFileName, renderConfigFile } from '../lib';

import type { DownloadedConfig } from '@gnomevpn/schemas';
import type { ConfigFile, IssueConfigInput } from '../configs.service.types';

@Injectable()
export class ConfigIssueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly peers: PeersService,
    private readonly subscription: SubscriptionService,
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

    const findExisting = () =>
      this.prisma.peer.findUnique({
        where: { userId_kind_name: { userId, kind: 'config', name } },
      });

    const [existing, { configLimit }, count] = await Promise.all([
      findExisting(),
      this.subscription.getLimits(userId),
      this.prisma.peer.count({ where: { userId, kind: 'config' } }),
    ]);

    if (!existing && count >= configLimit) {
      throw new AppBadRequestException('CONFIG_LIMIT_REACHED', `At most ${configLimit} configs`);
    }

    const created = await this.peers.issue({ node, userId, kind: 'config', name });

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.peer.findUnique({
            where: { userId_kind_name: { userId, kind: 'config', name } },
          });

          if (current) {
            await tx.peer.update({
              where: { id: current.id },
              data: { nodeId, xrayUserId: created.xrayUserId },
            });

            return;
          }

          if ((await tx.peer.count({ where: { userId, kind: 'config' } })) >= configLimit) {
            throw new AppBadRequestException(
              'CONFIG_LIMIT_REACHED',
              `At most ${configLimit} configs`,
            );
          }

          await tx.peer.create({
            data: { userId, nodeId, kind: 'config', name, xrayUserId: created.xrayUserId },
          });
        },
        { isolationLevel: 'Serializable' },
      );
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
