import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError, xrayClientForNode } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WG } from '../config';
import { generateWireguardKeys, nextWireguardIp, PEER_REF_SELECT, peerClientName } from '../lib';

import type {
  BulkPeerResult,
  CreatedPeer,
  CreateWireguardClientInput,
  DiscardPeerInput,
  FindPeersInput,
  IssueAndPersistInput,
  IssuePeerInput,
  PeerRef,
} from '../peers.service.types';

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
    name,
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
      select: { wgAssignedIp: true },
    });

    return rows.map((row) => row.wgAssignedIp).filter((ip): ip is string => Boolean(ip));
  }

  private async createWireguardClient({
    node,
    nodeId,
    email,
  }: CreateWireguardClientInput): Promise<CreatedPeer> {
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

  private async onNode(
    peer: PeerRef,
    run: (client: ReturnType<typeof xrayClientForNode>) => Promise<void>,
  ): Promise<boolean> {
    const node = await this.prisma.node.findUnique({
      where: { id: peer.nodeId },
      select: { apiUrl: true, apiTokenEnvVar: true },
    });

    if (!node) {
      return false;
    }

    try {
      await run(xrayClientForNode(node));

      return true;
    } catch (error) {
      this.logger.warn(`node op failed for peer ${peer.id}: ${describeError(error)}`);

      return false;
    }
  }

  async release(peer: PeerRef): Promise<boolean> {
    return this.onNode(peer, (client) => client.deleteClient(peerClientName(peer)));
  }

  async setEnabled(peer: PeerRef, enabled: boolean): Promise<boolean> {
    return this.onNode(peer, (client) =>
      client.setClientEnabled({ email: peerClientName(peer), enabled }),
    );
  }

  async setEnabledMany(peers: PeerRef[], enabled: boolean): Promise<BulkPeerResult> {
    let failed = 0;

    for (const peer of peers) {
      if (!(await this.setEnabled(peer, enabled))) {
        failed += 1;
      }
    }

    return { succeeded: peers.length - failed, failed };
  }

  async releaseMany(peers: PeerRef[]): Promise<BulkPeerResult> {
    const released: string[] = [];

    for (const peer of peers) {
      if (await this.release(peer)) {
        released.push(peer.id);
      }
    }

    await this.remove(released);

    return { succeeded: released.length, failed: peers.length - released.length };
  }

  async discard({ node, email }: DiscardPeerInput): Promise<void> {
    await xrayClientForNode(node)
      .deleteClient(email)
      .catch(() => undefined);
  }

  async remove(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.peer.deleteMany({ where: { id: { in: ids } } });
  }
}
