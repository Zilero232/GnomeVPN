import type { TunnelProtocol } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import type {
  BuildFeedInput,
  EnsurePeerInput,
  PersistSubscriptionPeerInput,
  ServerUrisInput,
  SubscriptionBody,
  SubscriptionNode,
  SubscriptionPeer
} from '../subscription-link.service.types';

import { AppNotFoundException } from '../../../common/exceptions';
import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService, withSerializableRetry } from '../../../core';
import { buildTunnelConfig, PeersService } from '../../peers';
import { SUBSCRIPTION_PEER_NAME } from '../config';
import { clientPlatform, incyHeaders, incyServerUri } from '../lib';

@Injectable()
export class SubscriptionFeedService {
  private readonly logger = new Logger(SubscriptionFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly peers: PeersService,
    private readonly config: AppConfigService
  ) {}

  async build({ token, userAgent }: BuildFeedInput): Promise<SubscriptionBody> {
    const link = await this.prisma.subscriptionLink.findUnique({
      where: { token },
      select: { userId: true, user: { select: { subscription: { select: { currentPeriodEnd: true } } } } }
    });

    if (!link) {
      throw new AppNotFoundException('SUBSCRIPTION_LINK_NOT_FOUND', 'Unknown subscription token');
    }

    await this.touch({ token, userAgent });

    const nodes = await this.availableNodes();
    const uris = await this.serverUris({ userId: link.userId, nodes });

    const headers = incyHeaders({
      currentPeriodEnd: link.user.subscription?.currentPeriodEnd ?? null,
      clientUrl: this.config.get('CLIENT_URL'),
      supportUrl: this.config.get('SUPPORT_URL') || null,
      announce: null
    });

    return { body: Buffer.from(uris.join('\n'), 'utf8').toString('base64'), headers };
  }

  private async touch({ token, userAgent }: BuildFeedInput): Promise<void> {
    try {
      await this.prisma.subscriptionLink.update({
        where: { token },
        data: { lastSeenAt: new Date(), lastPlatform: clientPlatform(userAgent) }
      });
    } catch (error) {
      this.logger.warn(`subscription touch failed: ${describeError(error)}`);
    }
  }

  private availableNodes(): Promise<SubscriptionNode[]> {
    return this.prisma.node.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        country: true,
        countryCode: true,
        city: true,
        host: true,
        port: true,
        serverName: true,
        apiUrl: true,
        apiTokenEnvVar: true,
        wgPublicKey: true,
        realityPublicKey: true,
        realityShortId: true
      }
    });
  }

  private async serverUris({ userId, nodes }: ServerUrisInput): Promise<string[]> {
    const targets = nodes.flatMap((node) => this.protocolsFor(node).map((protocol) => ({ node, protocol })));

    const issued = await Promise.all(targets.map(({ node, protocol }) => this.ensurePeer({ userId, node, protocol })));

    return issued
      .map((peer, index) => {
        if (!peer) {
          return null;
        }

        const { node, protocol } = targets[index];
        const config = buildTunnelConfig({ node, protocol, auth: peer.nodeCredential });

        return incyServerUri({ config, country: node.country, countryCode: node.countryCode, city: node.city });
      })
      .filter(isNonNullish);
  }

  // Hysteria2 is the default because QUIC survives packet loss better. VLESS
  // rides TCP and exists for the networks that drop UDP wholesale, so it is
  // only offered where the node was actually provisioned with a Reality
  // inbound — advertising one without the keys would hand the client a server
  // it can never reach.
  private protocolsFor(node: SubscriptionNode): TunnelProtocol[] {
    const hasReality = isNonNullish(node.realityPublicKey) && isNonNullish(node.realityShortId);

    return hasReality ? [TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.vless] : [TUNNEL_PROTOCOL.hysteria2];
  }

  private async ensurePeer({ userId, node, protocol }: EnsurePeerInput): Promise<SubscriptionPeer | null> {
    const existing = await this.prisma.peer.findUnique({
      where: {
        userId_kind_name_nodeId_protocol: {
          userId,
          kind: 'config',
          name: SUBSCRIPTION_PEER_NAME,
          nodeId: node.id,
          protocol
        }
      },
      select: { nodeCredential: true, nodeId: true }
    });

    if (existing) {
      return existing;
    }

    try {
      const created = await this.peers.issueAndPersist({
        node,
        nodeId: node.id,
        userId,
        kind: 'config',
        protocol,
        name: SUBSCRIPTION_PEER_NAME,
        persist: (peer) => this.persistPeer({ userId, nodeId: node.id, protocol, nodeCredential: peer.nodeCredential })
      });

      return { nodeCredential: created.nodeCredential, nodeId: node.id };
    } catch (error) {
      this.logger.warn(`subscription peer failed on node ${node.id} over ${protocol}: ${describeError(error)}`);

      return null;
    }
  }

  private persistPeer({ userId, nodeId, protocol, nodeCredential }: PersistSubscriptionPeerInput): Promise<void> {
    return withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          await tx.peer.upsert({
            where: {
              userId_kind_name_nodeId_protocol: {
                userId,
                kind: 'config',
                name: SUBSCRIPTION_PEER_NAME,
                nodeId,
                protocol
              }
            },
            update: { nodeCredential },
            create: { userId, kind: 'config', protocol, name: SUBSCRIPTION_PEER_NAME, nodeId, nodeCredential }
          });
        },
        { isolationLevel: 'Serializable' }
      )
    );
  }
}
