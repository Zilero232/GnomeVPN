import type { TunnelProtocol } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import type { NodeTraffic } from '../../../lib';
import type {
  EnsurePeerInput,
  NodeTrafficInput,
  OneNodeTrafficInput,
  PersistPeerInput,
  SubscriptionNode,
  SubscriptionPeer
} from '../subscription-link.service.types';

import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService, withSerializableRetry } from '../../../core';
import { NO_TRAFFIC, sumTraffic } from '../../../lib';
import { hasReality, peerClientNames, PeersService } from '../../peers';
import { SUBSCRIPTION_PEER_NAME } from '../config';

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

  async ensure({ userId, node, protocol, limitIp }: EnsurePeerInput): Promise<SubscriptionPeer | null> {
    const existing = await this.prisma.peer.findUnique({
      where: { userId_kind_name_nodeId_protocol: this.identity({ userId, nodeId: node.id, protocol }) },
      select: { nodeCredential: true }
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
        limitIp,
        name: SUBSCRIPTION_PEER_NAME,
        persist: (peer) => this.persist({ userId, nodeId: node.id, protocol, nodeCredential: peer.nodeCredential })
      });

      return { nodeCredential: created.nodeCredential };
    } catch (error) {
      this.logger.warn(`subscription peer failed on node ${node.id} over ${protocol}: ${describeError(error)}`);

      return null;
    }
  }

  async traffic({ userId, nodes }: NodeTrafficInput): Promise<NodeTraffic> {
    const emails = new Set(
      nodes.flatMap((node) => this.protocolsFor(node).flatMap((protocol) => peerClientNames(this.identity({ userId, nodeId: node.id, protocol }))))
    );

    const perNode = await Promise.all(nodes.map((node) => this.nodeTraffic({ node, emails })));

    return sumTraffic(perNode);
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
    return { userId, kind: 'config', name: SUBSCRIPTION_PEER_NAME, nodeId, protocol } as const;
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
