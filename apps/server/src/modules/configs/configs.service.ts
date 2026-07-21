import { Injectable, Logger } from '@nestjs/common';

import { AppBadRequestException, AppServiceUnavailableException } from '../../common/exceptions';
import { PrismaService } from '../../core';
import { NodesService } from '../nodes';
import { buildTunnelConfig, PEER_REF_SELECT, PeersService } from '../peers';
import { CONFIG_LIMIT } from './config';
import { configFileName, renderConfigFile } from './lib';

import type { DownloadedConfig } from '@gnomevpn/schemas';
import type { ConfigFile, IssueConfigInput, RevokeConfigInput } from './configs.service.types';

@Injectable()
export class ConfigsService {
  private readonly logger = new Logger(ConfigsService.name);

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
        config: buildTunnelConfig({ node, xrayUserId: created.xrayUserId }),
      }),
    };
  }

  async revoke({ userId, id }: RevokeConfigInput): Promise<void> {
    const [existing] = await this.prisma.peer.findMany({
      where: { id, userId, kind: 'config' },
      select: PEER_REF_SELECT,
    });

    if (!existing) {
      return;
    }

    if (!(await this.peers.release(existing))) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Could not revoke the peer');
    }

    await this.peers.remove([existing.id]);
  }

  async revokeAll(userId: string): Promise<void> {
    const rows = await this.peers.findRefs({ userId, kind: 'config' });

    const released: string[] = [];

    for (const row of rows) {
      if (await this.peers.release(row)) {
        released.push(row.id);
      }
    }

    await this.peers.remove(released);

    if (released.length < rows.length) {
      this.logger.warn(
        `Kept ${rows.length - released.length} config row(s) for ${userId}: peers still live`,
      );
    }
  }
}
