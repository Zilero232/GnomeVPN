import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { groupBy, isEmpty } from 'remeda';

import type { Prisma } from '../../../../generated';
import type {
  CreatedPeer,
  CreateWireguardClientInput,
  DiscardPeerInput,
  FindPeersInput,
  IssueAndPersistInput,
  IssuePeerInput,
  PeerRef,
  SetPeerEnabledInput
} from '../peers.service.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WG } from '../config';
import { generateWireguardKeys, nextWireguardIp, PEER_REF_SELECT, peerClientName } from '../lib';

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

  async issue({
    node,
    nodeId,
    userId,
    kind,
    protocol,
    name
  }: IssuePeerInput): Promise<CreatedPeer> {
    const email = peerClientName({ userId, kind, name, nodeId });

    if (protocol === TUNNEL_PROTOCOL.wireguard) {
      if (!nodeId) {
        throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wireguard needs a node');
      }

      return this.createWireguardClient({ node, nodeId, email });
    }

    try {
      const created = await xrayClientForNode(node).createClient(email);

      return { nodeCredential: created.nodeCredential, email, protocol: TUNNEL_PROTOCOL.hysteria2 };
    } catch (error) {
      this.logger.error(`createClient failed on ${node.apiUrl}: ${describeError(error)}`);

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
    }
  }

  private async takenWireguardIps(nodeId: string): Promise<string[]> {
    const rows = await this.prisma.peer.findMany({
      where: { nodeId, wgAssignedIp: { not: null } },
      select: { wgAssignedIp: true }
    });

    return rows.map((row) => row.wgAssignedIp).filter((ip): ip is string => Boolean(ip));
  }

  private async createWireguardClient({
    node,
    nodeId,
    email
  }: CreateWireguardClientInput): Promise<CreatedPeer> {
    if (!node.wgPublicKey) {
      throw new AppServiceUnavailableException(
        'NODE_UNAVAILABLE',
        'node has no wireguard endpoint'
      );
    }

    const takenIps = await this.takenWireguardIps(nodeId);
    const keys = generateWireguardKeys();

    try {
      const assignedIp = await xrayClientForNode(node).addWireguardPeer({
        email,
        publicKey: keys.publicKey,
        takenIps,
        allocateIp: (taken) => nextWireguardIp({ subnet: WG.subnet, taken })
      });

      return {
        nodeCredential: keys.publicKey,
        email,
        protocol: TUNNEL_PROTOCOL.wireguard,
        wgAssignedIp: assignedIp,
        wgPrivateKey: keys.privateKey
      };
    } catch (error) {
      this.logger.error(`addWireguardPeer failed on ${node.apiUrl}: ${describeError(error)}`);

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
    }
  }

  async onlinePeerIds(peers: PeerRef[]): Promise<Set<string>> {
    const byNode = groupBy(peers, (peer) => peer.nodeId);
    const online = new Set<string>();

    await Promise.all(
      Object.entries(byNode).map(async ([nodeId, nodePeers]) => {
        const node = await this.prisma.node.findUnique({
          where: { id: nodeId },
          select: { apiUrl: true, apiTokenEnvVar: true }
        });

        if (!node) {
          return;
        }

        const emails = await xrayClientForNode(node)
          .onlineEmails()
          .catch(() => null);

        for (const peer of nodePeers) {
          if (emails === null || emails.has(peerClientName(peer))) {
            online.add(peer.id);
          }
        }
      })
    );

    return online;
  }

  async revoke(where: Prisma.PeerWhereInput): Promise<void> {
    await this.prisma.peer.updateMany({ where, data: { state: 'revoked' } });
  }

  async releaseNow(peers: PeerRef[]): Promise<void> {
    if (isEmpty(peers)) {
      return;
    }

    await this.prisma.peer.updateMany({
      where: { id: { in: peers.map((peer) => peer.id) } },
      data: { state: 'revoked' }
    });

    const byNode = groupBy(peers, (peer) => peer.nodeId);

    await Promise.all(
      Object.entries(byNode).map(async ([nodeId, nodePeers]) => {
        const node = await this.prisma.node.findUnique({
          where: { id: nodeId },
          select: { apiUrl: true, apiTokenEnvVar: true }
        });

        if (!node) {
          return;
        }

        const client = xrayClientForNode(node);

        await Promise.all(
          nodePeers.map((peer) => client.deleteClient(peerClientName(peer)).catch(() => undefined))
        );
      })
    );
  }

  async setEnabled({ where, enabled }: SetPeerEnabledInput): Promise<void> {
    await this.prisma.peer.updateMany({
      where,
      data: { state: enabled ? 'active' : 'disabled' }
    });
  }

  async discard({ node, email }: DiscardPeerInput): Promise<void> {
    await xrayClientForNode(node)
      .deleteClient(email)
      .catch(() => undefined);
  }
}
