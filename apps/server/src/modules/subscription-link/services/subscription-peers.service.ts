import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import type { EnsurePeerInput, PersistPeerInput, SubscriptionNode, SubscriptionPeer } from '../subscription-link.service.types';

import { describeError } from '../../../common/lib';
import { PrismaService, withSerializableRetry } from '../../../core';
import { PeersService } from '../../peers';
import { SUBSCRIPTION_PEER_NAME } from '../config';

@Injectable()
export class SubscriptionPeersService {
  private readonly logger = new Logger(SubscriptionPeersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly peers: PeersService
  ) {}

  protocolsFor(node: SubscriptionNode) {
    const hasReality = isNonNullish(node.realityPublicKey) && isNonNullish(node.realityShortId);

    return hasReality ? [TUNNEL_PROTOCOL.hysteria2, TUNNEL_PROTOCOL.vless] : [TUNNEL_PROTOCOL.hysteria2];
  }

  async ensure({ userId, node, protocol }: EnsurePeerInput): Promise<SubscriptionPeer | null> {
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
        name: SUBSCRIPTION_PEER_NAME,
        persist: (peer) => this.persist({ userId, nodeId: node.id, protocol, nodeCredential: peer.nodeCredential })
      });

      return { nodeCredential: created.nodeCredential };
    } catch (error) {
      this.logger.warn(`subscription peer failed on node ${node.id} over ${protocol}: ${describeError(error)}`);

      return null;
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
