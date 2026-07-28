import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PeersService, peerWgData } from '../../peers';
import { SubscriptionService } from '../../subscription';
import { HYSTERIA2_FILE_EXTENSION, WIREGUARD_FILE_EXTENSION } from '../config';
import { configFileName, renderConfigFile, renderWireguardConfigFile } from '../lib';

import type { DownloadedConfig } from '@gnomevpn/schemas';
import type {
  ConfigContentInput,
  ConfigFile,
  ConfigFileNameInput,
  IssueConfigInput,
} from '../configs.service.types';

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
        protocol: true,
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
      protocol: row.protocol,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async issue({ userId, nodeId, name, protocol }: IssueConfigInput): Promise<ConfigFile> {
    const node = await this.nodes.getNodeForConnect(nodeId);

    const findExisting = () =>
      this.prisma.peer.findUnique({
        where: {
          userId_kind_name_nodeId_protocol: { userId, kind: 'config', name, nodeId, protocol },
        },
      });

    const [existing, { configLimit }, count] = await Promise.all([
      findExisting(),
      this.subscription.getLimits(userId),
      this.prisma.peer.count({ where: { userId, kind: 'config' } }),
    ]);

    if (!existing && count >= configLimit) {
      throw new AppBadRequestException('CONFIG_LIMIT_REACHED', `At most ${configLimit} configs`);
    }

    const created = await this.peers.issueAndPersist({
      node,
      nodeId,
      userId,
      kind: 'config',
      protocol,
      name,
      persist: (peer) =>
        this.prisma.$transaction(
          async (tx) => {
            const current = await tx.peer.findUnique({
              where: {
                userId_kind_name_nodeId_protocol: {
                  userId,
                  kind: 'config',
                  name,
                  nodeId,
                  protocol,
                },
              },
            });

            const data = { nodeId, nodeCredential: peer.nodeCredential, ...peerWgData(peer) };

            if (current) {
              await tx.peer.update({ where: { id: current.id }, data });

              return;
            }

            if ((await tx.peer.count({ where: { userId, kind: 'config' } })) >= configLimit) {
              throw new AppBadRequestException(
                'CONFIG_LIMIT_REACHED',
                `At most ${configLimit} configs`,
              );
            }

            await tx.peer.create({
              data: { userId, kind: 'config', protocol, name, ...data },
            });
          },
          { isolationLevel: 'Serializable' },
        ),
    });

    const config = buildTunnelConfig({
      node,
      protocol,
      auth: created.nodeCredential,
      wgPrivateKey: created.wgPrivateKey,
      wgAssignedIp: created.wgAssignedIp,
    });

    return {
      fileName: this.fileName({ country: node.country, name, protocol }),
      content: this.render({ config, deviceName: name, country: node.country, protocol }),
    };
  }

  private fileName({ country, name, protocol }: ConfigFileNameInput): string {
    const extension =
      protocol === TUNNEL_PROTOCOL.wireguard ? WIREGUARD_FILE_EXTENSION : HYSTERIA2_FILE_EXTENSION;

    return `${configFileName({ country, deviceName: name })}.${extension}`;
  }

  private render({ config, deviceName, country, protocol }: ConfigContentInput): string {
    return protocol === TUNNEL_PROTOCOL.wireguard
      ? renderWireguardConfigFile({ config })
      : renderConfigFile({ config, deviceName, country });
  }
}
