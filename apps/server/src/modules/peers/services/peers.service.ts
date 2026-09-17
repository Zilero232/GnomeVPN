import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { groupBy, isEmpty } from 'remeda';
import { match } from 'ts-pattern';

import type { Prisma } from '../../../../generated';
import type {
  CreatedPeer,
  DeleteClientInput,
  DiscardPeerInput,
  FindPeersInput,
  ForEachNodeInput,
  IssueAndPersistInput,
  IssuePeerInput,
  OnlinePeerRef,
  PeerRef,
  SetPeerEnabledInput
} from '../peers.service.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { NODE_ACCESS_SELECT, PEER_REF_SELECT } from '../config';
import { peerClientName } from '../lib';

@Injectable()
export class PeersService {
  private readonly logger = new Logger(PeersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findRefs(where: FindPeersInput): Promise<PeerRef[]> {
    return this.prisma.peer.findMany({ where, select: PEER_REF_SELECT });
  }

  async issueAndPersist({ persist, ...input }: IssueAndPersistInput): Promise<CreatedPeer> {
    const created = await this.issue(input);

    try {
      await persist(created);
    } catch (error) {
      await this.discard({ node: input.node, email: created.email });

      throw error;
    }

    return created;
  }

  async issue({ node, nodeId, userId, kind, protocol, name }: IssuePeerInput): Promise<CreatedPeer> {
    const email = peerClientName({ userId, kind, name, nodeId, protocol });
    const client = xrayClientForNode(node);

    const create = match(protocol)
      .with(TUNNEL_PROTOCOL.vless, () => () => client.createVlessClient(email))
      .otherwise(() => () => client.createClient(email));

    try {
      const created = await create();

      return { nodeCredential: created.nodeCredential, email, protocol };
    } catch (error) {
      this.logger.error(`issuing a ${protocol} client failed on ${node.apiUrl}: ${describeError(error)}`);

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
    }
  }

  private async forEachNode<TPeer extends { nodeId: string }>({ peers, run }: ForEachNodeInput<TPeer>): Promise<void> {
    const byNode = groupBy(peers, (peer) => peer.nodeId);

    await Promise.all(
      Object.entries(byNode).map(async ([nodeId, nodePeers]) => {
        const node = await this.prisma.node.findUnique({
          where: { id: nodeId },
          select: NODE_ACCESS_SELECT
        });

        if (!node) {
          return;
        }

        await run({ client: xrayClientForNode(node), peers: nodePeers });
      })
    );
  }

  async onlinePeerIds(peers: OnlinePeerRef[], { assumeOnlineWhenNodeSilent = true } = {}): Promise<Set<string>> {
    const online = new Set<string>();

    await this.forEachNode<OnlinePeerRef>({
      peers,
      run: async ({ client, peers: nodePeers }) => {
        const emails = await client.onlineEmails().catch(() => null);

        for (const peer of nodePeers) {
          const isOnline = emails === null ? assumeOnlineWhenNodeSilent : emails.has(peerClientName(peer));

          if (isOnline) {
            online.add(peer.id);
          }
        }
      }
    });

    return online;
  }

  async revoke(where: Prisma.PeerWhereInput): Promise<void> {
    await this.prisma.peer.updateMany({ where, data: { state: 'revoked' } });
  }

  private async deleteFromNodes(peers: PeerRef[]): Promise<void> {
    await this.forEachNode<PeerRef>({
      peers,
      run: async ({ client, peers: nodePeers }) => {
        await Promise.all(nodePeers.map((peer) => this.deleteClient({ client, email: peerClientName(peer) })));
      }
    });
  }

  private async deleteClient({ client, email }: DeleteClientInput): Promise<void> {
    await client.deleteClient(email).catch((error: unknown) => {
      this.logger.warn(`could not delete ${email} on its node: ${describeError(error)}`);
    });
  }

  async releaseDetached(peers: PeerRef[]): Promise<void> {
    if (isEmpty(peers)) {
      return;
    }

    await this.prisma.peer.deleteMany({
      where: { id: { in: peers.map((peer) => peer.id) } }
    });

    void this.deleteFromNodes(peers).catch((error: unknown) => {
      this.logger.warn(`could not release peers on their node: ${describeError(error)}`);
    });
  }

  async setEnabled({ where, enabled }: SetPeerEnabledInput): Promise<void> {
    await this.prisma.peer.updateMany({
      where,
      data: { state: enabled ? 'active' : 'disabled' }
    });
  }

  async discard({ node, email }: DiscardPeerInput): Promise<void> {
    await this.deleteClient({ client: xrayClientForNode(node), email });
  }
}
