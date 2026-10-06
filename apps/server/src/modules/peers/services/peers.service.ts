import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { groupBy, isEmpty } from 'remeda';
import { match } from 'ts-pattern';

import type { NodeAccess } from '../../../common/lib';
import type {
  CreatedPeer,
  DeleteClientInput,
  DiscardPeerInput,
  ForEachNodeInput,
  IssueAndPersistInput,
  IssuePeerInput,
  PeerRef,
  SetPeerEnabledInput
} from '../peers.service.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError, IDENTIFIED_NODE_SELECT, xrayClientForNode } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { peerClientName } from '../lib';

@Injectable()
export class PeersService {
  private readonly logger = new Logger(PeersService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async issue({ node, nodeId, userId, kind, protocol, limitIp, name, deferRestart }: IssuePeerInput): Promise<CreatedPeer> {
    const email = peerClientName({ userId, kind, name, nodeId, protocol });
    const client = xrayClientForNode(node);

    const create = match(protocol)
      .with(TUNNEL_PROTOCOL.vless, () => () => client.createVlessClient({ email, limitIp, deferRestart }))
      .otherwise(() => () => client.createClient({ email, limitIp, deferRestart }));

    try {
      const created = await create();

      return { nodeCredential: created.nodeCredential, email, protocol };
    } catch (error) {
      this.logger.error(`issuing a ${protocol} client failed on node ${nodeId}: ${describeError(error)}`);

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
    }
  }

  private async forEachNode<TPeer extends { nodeId: string }>({ peers, run }: ForEachNodeInput<TPeer>): Promise<void> {
    const byNode = groupBy(peers, (peer) => peer.nodeId);

    const nodes = await this.prisma.node.findMany({
      where: { id: { in: Object.keys(byNode) } },
      select: IDENTIFIED_NODE_SELECT
    });

    await Promise.all(nodes.map((node) => run({ client: xrayClientForNode(node), peers: byNode[node.id] ?? [] })));
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

  async restartCore(node: NodeAccess): Promise<void> {
    await xrayClientForNode(node).restartCore();
  }

  async discard({ node, email }: DiscardPeerInput): Promise<void> {
    await this.deleteClient({ client: xrayClientForNode(node), email });
  }
}
