import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { describeError, resolveNodeApiKey } from '../../common/lib';
import { PrismaService } from '../../core';
import { XrayClient } from '../../lib';
import { PEER_REF_SELECT, peerClientName } from './lib';

import type {
  CreatedPeer,
  DiscardPeerInput,
  FindPeersInput,
  IssuePeerInput,
  PeerRef,
} from './peers.service.types';

@Injectable()
export class PeersService {
  private readonly logger = new Logger(PeersService.name);

  constructor(private readonly prisma: PrismaService) {}

  client(baseUrl: string, tokenRef: string): XrayClient {
    return new XrayClient({ baseUrl, token: resolveNodeApiKey(tokenRef) });
  }

  async issue({ node, userId, kind, name }: IssuePeerInput): Promise<CreatedPeer> {
    const email = peerClientName({ userId, kind, name });

    try {
      const created = await this.client(node.apiUrl, node.apiTokenEnvVar).createClient(email);

      return { xrayUserId: created.xrayUserId, email };
    } catch (error) {
      this.logger.error(`createClient failed on ${node.apiUrl}: ${describeError(error)}`);

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

    const email = peerClientName({ ...peer, name: peer.name ?? undefined });

    try {
      await this.client(node.apiUrl, node.apiTokenEnvVar).deleteClient(email);

      return true;
    } catch (error) {
      this.logger.warn(`Failed to release peer ${email}: ${describeError(error)}`);

      return false;
    }
  }

  async discard({ node, email }: DiscardPeerInput): Promise<void> {
    await this.client(node.apiUrl, node.apiTokenEnvVar)
      .deleteClient(email)
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
