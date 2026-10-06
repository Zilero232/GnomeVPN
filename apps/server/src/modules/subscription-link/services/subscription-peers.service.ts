import type { TunnelProtocol } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNonNullish } from 'remeda';

import type { NodeTraffic } from '../../../lib';
import type {
  EnsureNodeInput,
  FeedPeer,
  ForgetPeersInput,
  IssueFeedPeerInput,
  NodeTrafficInput,
  OneNodeTrafficInput,
  PersistPeerInput,
  SubscriptionNode
} from '../subscription-link.service.types';

import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService, withSerializableRetry } from '../../../core';
import { NO_TRAFFIC, sumTraffic } from '../../../lib';
import { hasReality, peerClientNames, PeersService } from '../../peers';
import { FEED } from '../config';

@Injectable()
export class SubscriptionPeersService {
  private readonly logger = new Logger(SubscriptionPeersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly peers: PeersService
  ) {}

  protocolsFor(node: SubscriptionNode): TunnelProtocol[] {
    return hasReality(node) ? [TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.vless] : [TUNNEL_PROTOCOL.hysteria2];
  }

  async ensureNode({ userId, node, limitIp }: EnsureNodeInput): Promise<FeedPeer[]> {
    const protocols = this.protocolsFor(node);

    const existing = await this.prisma.peer.findMany({
      where: { userId, kind: 'config', name: FEED.peerName, nodeId: node.id, protocol: { in: protocols } },
      select: { protocol: true, nodeCredential: true }
    });

    const missing = protocols.filter((protocol) => !existing.some((peer) => peer.protocol === protocol));

    if (isEmpty(missing)) {
      return existing;
    }

    const issued = (await Promise.all(missing.map((protocol) => this.issue({ userId, node, protocol, limitIp })))).filter(isNonNullish);

    if (isEmpty(issued)) {
      return existing;
    }

    try {
      await this.peers.restartCore(node);
    } catch (error) {
      this.logger.warn(`node ${node.id} did not restart after issuing, its new peers wait for the next fetch: ${describeError(error)}`);

      await this.forget({ userId, nodeId: node.id, protocols: issued.map((peer) => peer.protocol) });

      return existing;
    }

    return [...existing, ...issued];
  }

  async traffic({ userId, nodes }: NodeTrafficInput): Promise<NodeTraffic> {
    const emails = new Set(
      nodes.flatMap((node) => this.protocolsFor(node).flatMap((protocol) => peerClientNames(this.identity({ userId, nodeId: node.id, protocol }))))
    );

    const perNode = await Promise.all(nodes.map((node) => this.nodeTraffic({ node, emails })));

    return sumTraffic(perNode);
  }

  private async issue({ userId, node, protocol, limitIp }: IssueFeedPeerInput): Promise<FeedPeer | null> {
    try {
      const created = await this.peers.issueAndPersist({
        node,
        nodeId: node.id,
        userId,
        kind: 'config',
        protocol,
        limitIp,
        name: FEED.peerName,
        deferRestart: true,
        persist: (peer) => this.persist({ userId, nodeId: node.id, protocol, nodeCredential: peer.nodeCredential })
      });

      return { protocol, nodeCredential: created.nodeCredential };
    } catch (error) {
      this.logger.warn(`subscription peer failed on node ${node.id} over ${protocol}: ${describeError(error)}`);

      return null;
    }
  }

  private async forget({ userId, nodeId, protocols }: ForgetPeersInput): Promise<void> {
    await this.prisma.peer
      .deleteMany({ where: { userId, kind: 'config', name: FEED.peerName, nodeId, protocol: { in: protocols } } })
      .catch((error: unknown) => {
        this.logger.warn(`unrestarted peers on node ${nodeId} were not forgotten: ${describeError(error)}`);
      });
  }

  private async nodeTraffic({ node, emails }: OneNodeTrafficInput): Promise<NodeTraffic> {
    try {
      return await xrayClientForNode(node).trafficFor(emails);
    } catch (error) {
      this.logger.warn(`traffic unavailable on node ${node.id}: ${describeError(error)}`);

      return NO_TRAFFIC;
    }
  }

  private identity({ userId, nodeId, protocol }: Omit<PersistPeerInput, 'nodeCredential'>) {
    return { userId, kind: 'config', name: FEED.peerName, nodeId, protocol } as const;
  }

  private persist({ userId, nodeId, protocol, nodeCredential }: PersistPeerInput): Promise<void> {
    const identity = this.identity({ userId, nodeId, protocol });

    return withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          await tx.peer.upsert({
            where: { userId_kind_name_nodeId_protocol: identity },
            update: { nodeCredential },
            create: { ...identity, nodeCredential }
          });
        },
        { isolationLevel: 'Serializable' }
      )
    );
  }
}
