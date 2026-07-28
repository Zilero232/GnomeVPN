import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../../common/exceptions';
import { PrismaService, withSerializableRetry } from '../../../core';
import { NodesService } from '../../nodes';
import { buildTunnelConfig, PeersService, peerWgData } from '../../peers';
import { SubscriptionService } from '../../subscription';
import { renderConfig } from '../lib';

import type { DownloadedConfig } from '@gnomevpn/schemas';
import type {
  BuildConfigFileInput,
  ConfigFile,
  ConfigPeerKey,
  IssueConfigInput,
  PersistConfigPeerInput,
  RebuildWireguardInput,
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

    const [existing, { configLimit }, count] = await Promise.all([
      this.findConfigPeer({ userId, nodeId, name, protocol }),
      this.subscription.getLimits(userId),
      this.prisma.peer.count({ where: { userId, kind: 'config' } }),
    ]);

    if (!existing && count >= configLimit) {
      throw new AppBadRequestException('CONFIG_LIMIT_REACHED', `At most ${configLimit} configs`);
    }

    if (protocol === TUNNEL_PROTOCOL.wireguard && existing) {
      const reused = this.rebuildWireguardConfig({ node, name, peer: existing });

      if (reused) {
        return reused;
      }
    }

    const created = await this.peers.issueAndPersist({
      node,
      nodeId,
      userId,
      kind: 'config',
      protocol,
      name,
      persist: (peer) =>
        this.persistConfigPeer({ userId, nodeId, name, protocol, configLimit, peer }),
    });

    return this.buildFile({
      node,
      name,
      protocol,
      auth: created.nodeCredential,
      wgPrivateKey: created.wgPrivateKey,
      wgAssignedIp: created.wgAssignedIp,
    });
  }

  private findConfigPeer({ userId, nodeId, name, protocol }: ConfigPeerKey) {
    return this.prisma.peer.findUnique({
      where: {
        userId_kind_name_nodeId_protocol: { userId, kind: 'config', name, nodeId, protocol },
      },
    });
  }

  private rebuildWireguardConfig({ node, name, peer }: RebuildWireguardInput): ConfigFile | null {
    if (!peer.wgPrivateKey || !peer.wgAssignedIp) {
      return null;
    }

    return this.buildFile({
      node,
      name,
      protocol: TUNNEL_PROTOCOL.wireguard,
      auth: peer.nodeCredential,
      wgPrivateKey: peer.wgPrivateKey,
      wgAssignedIp: peer.wgAssignedIp,
    });
  }

  private persistConfigPeer({
    userId,
    nodeId,
    name,
    protocol,
    configLimit,
    peer,
  }: PersistConfigPeerInput): Promise<void> {
    const data = { nodeId, nodeCredential: peer.nodeCredential, ...peerWgData(peer) };

    return withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const current = await tx.peer.findUnique({
            where: {
              userId_kind_name_nodeId_protocol: { userId, kind: 'config', name, nodeId, protocol },
            },
          });

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

          await tx.peer.create({ data: { userId, kind: 'config', protocol, name, ...data } });
        },
        { isolationLevel: 'Serializable' },
      ),
    );
  }

  private buildFile({
    node,
    name,
    protocol,
    auth,
    wgPrivateKey,
    wgAssignedIp,
  }: BuildConfigFileInput): ConfigFile {
    const config = buildTunnelConfig({ node, protocol, auth, wgPrivateKey, wgAssignedIp });

    return renderConfig({ config, protocol, country: node.country, deviceName: name });
  }
}
