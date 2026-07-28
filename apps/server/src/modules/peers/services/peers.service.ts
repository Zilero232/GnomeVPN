import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WG } from '../config';
import { generateWireguardKeys, nextWireguardIp, PEER_REF_SELECT, peerClientName } from '../lib';

import type {
  CreatedPeer,
  DiscardPeerInput,
  FindPeersInput,
  IssueAndPersistInput,
  IssuePeerInput,
  IssueWireguardPeerInput,
  PeerRef,
  ReleaseManyResult,
} from '../peers.service.types';

@Injectable()
export class PeersService {
  private readonly logger = new Logger(PeersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async issueAndPersist({ persist, ...input }: IssueAndPersistInput): Promise<CreatedPeer> {
    const created = await this.issue(input);

    try {
      await persist(created);
    } catch (error) {
      await this.discard({ node: input.node, email: created.email, protocol: created.protocol });

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
    name,
  }: IssuePeerInput): Promise<CreatedPeer> {
    const email = peerClientName({ userId, kind, name, nodeId });

    if (protocol === TUNNEL_PROTOCOL.wireguard) {
      if (!nodeId) {
        throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wireguard needs a node');
      }

      return this.issueWireguard({ node, nodeId, email });
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
      select: { wgAssignedIp: true },
    });

    return rows.map((row) => row.wgAssignedIp).filter((ip): ip is string => Boolean(ip));
  }

  private async issueWireguard({
    node,
    nodeId,
    email,
  }: IssueWireguardPeerInput): Promise<CreatedPeer> {
    if (!node.wgPublicKey) {
      throw new AppServiceUnavailableException(
        'NODE_UNAVAILABLE',
        'node has no wireguard endpoint',
      );
    }

    const takenIps = await this.takenWireguardIps(nodeId);
    const keys = generateWireguardKeys();

    try {
      const assignedIp = await xrayClientForNode(node).addWireguardPeer({
        email,
        publicKey: keys.publicKey,
        takenIps,
        allocateIp: (taken) => nextWireguardIp({ subnet: WG.subnet, taken }),
      });

      return {
        nodeCredential: keys.publicKey,
        email,
        protocol: TUNNEL_PROTOCOL.wireguard,
        wgAssignedIp: assignedIp,
        wgPrivateKey: keys.privateKey,
      };
    } catch (error) {
      this.logger.error(`addWireguardPeer failed on ${node.apiUrl}: ${describeError(error)}`);

      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
    }
  }

  async release(peer: PeerRef): Promise<boolean> {
    const node = await this.prisma.node.findUnique({
      where: { id: peer.nodeId },
      select: { apiUrl: true, apiTokenEnvVar: true },
    });

    if (!node) {
      return false;
    }

    const email = peerClientName(peer);

    try {
      await xrayClientForNode(node).removePeer({
        email,
        protocol: peer.protocol,
      });

      return true;
    } catch (error) {
      this.logger.warn(`Failed to release peer ${email}: ${describeError(error)}`);

      return false;
    }
  }

  async releaseMany(peers: PeerRef[]): Promise<ReleaseManyResult> {
    const released: string[] = [];

    for (const peer of peers) {
      if (await this.release(peer)) {
        released.push(peer.id);
      }
    }

    await this.remove(released);

    return { released: released.length, kept: peers.length - released.length };
  }

  async discard({ node, email, protocol }: DiscardPeerInput): Promise<void> {
    await xrayClientForNode(node)
      .removePeer({ email, protocol: protocol ?? TUNNEL_PROTOCOL.hysteria2 })
      .catch(() => undefined);
  }

  async findRefs(where: FindPeersInput): Promise<PeerRef[]> {
    return this.prisma.peer.findMany({ where, select: PEER_REF_SELECT });
  }

  async remove(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.peer.deleteMany({ where: { id: { in: ids } } });
  }
}
