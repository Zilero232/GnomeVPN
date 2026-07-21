import { Injectable, Logger } from '@nestjs/common';

import { AppBadRequestException, AppServiceUnavailableException } from '../../common/exceptions';
import { describeError, resolveNodeApiKey } from '../../common/lib';
import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';
import { NodesService } from '../nodes';
import { ALLOWED_IPS, CONFIG_LIMIT, KEEPALIVE, SESSION_PEER_NAME } from './config';
import { configFileName, peerClientName, renderConfigFile } from './lib';

import type { DownloadedConfig, TunnelConfig } from '@gnomevpn/schemas';
import type { ConfigFile, IssueConfigInput, PeerRef } from './tunnel.types';

@Injectable()
export class TunnelService {
  private readonly logger = new Logger(TunnelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
  ) {}

  private makeWgClient(baseUrl: string, apiKeyRef: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey: resolveNodeApiKey(apiKeyRef) });
  }

  private async releasePeer({ nodeId, wgEasyClientId }: PeerRef): Promise<boolean> {
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      select: { wgEasyUrl: true, wgEasyApiKeyEnvVar: true },
    });

    if (!node) {
      return false;
    }

    try {
      await this.makeWgClient(node.wgEasyUrl, node.wgEasyApiKeyEnvVar).deleteClient(wgEasyClientId);

      return true;
    } catch (error) {
      this.logger.warn(`Failed to release peer ${wgEasyClientId}: ${describeError(error)}`);

      return false;
    }
  }

  async connect(userId: string, nodeId: string): Promise<TunnelConfig> {
    const node = await this.nodes.getNodeForConnect(nodeId);
    const wg = this.makeWgClient(node.wgEasyUrl, node.wgEasyApiKeyEnvVar);

    const existing = await this.prisma.peer.findUnique({
      where: { userId_kind_name: { userId, kind: 'session', name: SESSION_PEER_NAME } },
    });

    let created: Awaited<ReturnType<WgEasyClient['createClient']>>;

    try {
      created = await wg.createClient(peerClientName({ userId, kind: 'session' }));
    } catch {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wg-easy node unreachable');
    }

    try {
      await this.prisma.peer.upsert({
        where: { userId_kind_name: { userId, kind: 'session', name: SESSION_PEER_NAME } },
        create: {
          userId,
          nodeId,
          kind: 'session',
          name: SESSION_PEER_NAME,
          wgEasyClientId: created.clientId,
        },
        update: { nodeId, wgEasyClientId: created.clientId, lastHandshakeAt: null },
      });
    } catch (error) {
      await wg.deleteClient(created.clientId).catch(() => undefined);
      throw error;
    }

    if (existing) {
      await this.releasePeer(existing);
    }

    return {
      privateKey: created.privateKey,
      address: created.address,
      dns: created.dns,
      serverPublicKey: created.serverPublicKey,
      presharedKey: created.presharedKey,
      endpoint: node.wireguardEndpoint,
      allowedIps: ALLOWED_IPS,
      persistentKeepalive: KEEPALIVE,
    };
  }

  async disconnect(userId: string): Promise<void> {
    const existing = await this.prisma.peer.findUnique({
      where: { userId_kind_name: { userId, kind: 'session', name: SESSION_PEER_NAME } },
    });

    if (!existing) {
      return;
    }

    await this.releasePeer(existing);

    await this.prisma.peer.deleteMany({ where: { id: existing.id } });
  }

  async listConfigs(userId: string): Promise<DownloadedConfig[]> {
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

  async issueConfig({ userId, nodeId, name }: IssueConfigInput): Promise<ConfigFile> {
    const node = await this.nodes.getNodeForConnect(nodeId);
    const wg = this.makeWgClient(node.wgEasyUrl, node.wgEasyApiKeyEnvVar);

    const existing = await this.prisma.peer.findFirst({
      where: { userId, kind: 'config', name: { equals: name, mode: 'insensitive' } },
    });

    const count = await this.prisma.peer.count({ where: { userId, kind: 'config' } });

    if (!existing && count >= CONFIG_LIMIT) {
      throw new AppBadRequestException('CONFIG_LIMIT_REACHED', `At most ${CONFIG_LIMIT} configs`);
    }

    let created: Awaited<ReturnType<WgEasyClient['createClient']>>;

    try {
      created = await wg.createClient(peerClientName({ userId, kind: 'config', name }));
    } catch {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wg-easy node unreachable');
    }

    try {
      await (existing
        ? this.prisma.peer.update({
            where: { id: existing.id },
            data: { nodeId, wgEasyClientId: created.clientId },
          })
        : this.prisma.peer.create({
            data: { userId, nodeId, kind: 'config', name, wgEasyClientId: created.clientId },
          }));
    } catch (error) {
      await wg.deleteClient(created.clientId).catch(() => undefined);
      throw error;
    }

    if (existing) {
      await this.releasePeer(existing);
    }

    return {
      fileName: `${configFileName({ countryCode: node.countryCode, deviceName: name })}.conf`,
      content: renderConfigFile({
        deviceName: name,
        country: node.country,
        config: {
          privateKey: created.privateKey,
          address: created.address,
          dns: created.dns,
          serverPublicKey: created.serverPublicKey,
          presharedKey: created.presharedKey,
          endpoint: node.wireguardEndpoint,
          allowedIps: ALLOWED_IPS,
          persistentKeepalive: KEEPALIVE,
        },
      }),
    };
  }

  async revokeConfig(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.peer.findFirst({
      where: { id, userId, kind: 'config' },
      select: { id: true, nodeId: true, wgEasyClientId: true },
    });

    if (!existing) {
      return;
    }

    if (!(await this.releasePeer(existing))) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Could not revoke the peer');
    }

    await this.prisma.peer.deleteMany({ where: { id: existing.id } });
  }

  async revokeAllConfigs(userId: string): Promise<void> {
    const rows = await this.prisma.peer.findMany({
      where: { userId, kind: 'config' },
      select: { id: true, nodeId: true, wgEasyClientId: true },
    });

    const released: string[] = [];

    for (const row of rows) {
      if (await this.releasePeer(row)) {
        released.push(row.id);
      }
    }

    if (released.length > 0) {
      await this.prisma.peer.deleteMany({ where: { id: { in: released } } });
    }

    if (released.length < rows.length) {
      this.logger.warn(
        `Kept ${rows.length - released.length} config row(s) for ${userId}: peers still live`,
      );
    }
  }
}
