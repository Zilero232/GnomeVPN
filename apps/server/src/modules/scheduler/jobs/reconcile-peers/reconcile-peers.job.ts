import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isEmpty } from 'remeda';

import type { CollectOrphansInput, PeerIdentity, ReconcileNode, RemoveRevokedInput, SyncEnabledInput } from './reconcile-peers.job.types';

import { describeError, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { peerClientName } from '../../../peers';
import { BOOT_GRACE_MS, RECONCILE_CRON } from '../../config';

@Injectable()
export class ReconcilePeersJob {
  private readonly logger = new Logger(ReconcilePeersJob.name);
  private readonly bootedAt = Date.now();
  private readonly suspects = new Map<string, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  private emailOf(peer: PeerIdentity) {
    return peerClientName({
      userId: peer.userId,
      kind: peer.kind,
      name: peer.name,
      nodeId: peer.nodeId
    });
  }

  private async reconcileNode(node: ReconcileNode): Promise<void> {
    const xray = xrayClientForNode(node);

    const [peers, nodeClients, online] = await Promise.all([
      this.prisma.peer.findMany({
        where: { nodeId: node.id },
        select: {
          id: true,
          userId: true,
          kind: true,
          name: true,
          nodeId: true,
          protocol: true,
          state: true
        }
      }),
      xray.clientEnabledByEmail(),
      xray.onlineEmails()
    ]);

    const removed = await this.removeRevoked({ xray, peers, nodeClients });
    const synced = await this.syncEnabled({ xray, peers, nodeClients });
    const collected = await this.collectOrphans({ xray, nodeId: node.id, peers, nodeClients, online });

    if (removed || synced || collected) {
      await xray.restartCore();
    }
  }

  private async removeRevoked({ xray, peers, nodeClients }: RemoveRevokedInput): Promise<boolean> {
    const gone = peers.filter((peer) => peer.state === 'revoked');

    let removed = false;

    for (const peer of gone) {
      const claimed = await this.prisma.peer.deleteMany({
        where: { id: peer.id, state: 'revoked' }
      });

      if (claimed.count === 0) {
        continue;
      }

      const email = this.emailOf(peer);

      if (nodeClients.has(email)) {
        await xray.deleteClient(email);
        removed = true;
      }
    }

    return removed;
  }

  private async syncEnabled({ xray, peers, nodeClients }: SyncEnabledInput): Promise<boolean> {
    const toEnable: string[] = [];
    const toDisable: string[] = [];

    for (const peer of peers) {
      if (peer.state !== 'active' && peer.state !== 'disabled') {
        continue;
      }

      const email = this.emailOf(peer);

      if (!nodeClients.has(email)) {
        continue;
      }

      const desired = peer.state === 'active';

      if (nodeClients.get(email) !== desired) {
        (desired ? toEnable : toDisable).push(email);
      }
    }

    if (isEmpty(toEnable) && isEmpty(toDisable)) {
      return false;
    }

    await Promise.all([xray.setClientsEnabled({ emails: toEnable, enabled: true }), xray.setClientsEnabled({ emails: toDisable, enabled: false })]);

    return true;
  }

  private async collectOrphans({ xray, nodeId, peers, nodeClients, online }: CollectOrphansInput): Promise<boolean> {
    if (online === null) {
      this.suspects.delete(nodeId);

      return false;
    }

    const known = new Set(peers.map((peer) => this.emailOf(peer)));
    const seenBefore = this.suspects.get(nodeId) ?? new Set<string>();
    const seenNow = new Set<string>();

    let collected = false;

    for (const email of nodeClients.keys()) {
      if (known.has(email)) {
        continue;
      }

      if (!seenBefore.has(email)) {
        seenNow.add(email);

        continue;
      }

      await xray.deleteClient(email);
      collected = true;
    }

    this.suspects.set(nodeId, seenNow);

    return collected;
  }

  @Cron(RECONCILE_CRON)
  async run(): Promise<void> {
    if (Date.now() - this.bootedAt < BOOT_GRACE_MS) {
      return;
    }

    const nodes = await this.prisma.node.findMany({
      select: { id: true, apiUrl: true, apiTokenEnvVar: true }
    });

    const results = await Promise.allSettled(nodes.map((node) => this.reconcileNode(node)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Reconcile failed: ${describeError(result.reason)}`);
      }
    }
  }
}
