import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isEmpty, isNonNullish } from 'remeda';

import type {
  CollectOrphansInput,
  NoteFailureInput,
  PeerIdentity,
  ReconcileNode,
  RemoveRevokedInput,
  RestoreMissingInput,
  SyncEnabledInput
} from './reconcile-peers.job.types';

import { describeError, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { PEER_PREFIX, peerClientName, peerClientNames } from '../../../peers';
import { BOOT_GRACE_MS, RECONCILE_CRON, RECONCILE_FAILURE_ALERT_THRESHOLD } from '../../config';
import { ownerIdOf } from './lib';

@Injectable()
export class ReconcilePeersJob {
  private readonly logger = new Logger(ReconcilePeersJob.name);
  private readonly bootedAt = Date.now();
  private readonly suspects = new Map<string, Set<string>>();
  private readonly failures = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private namesOf(peer: PeerIdentity): string[] {
    return peerClientNames(peer);
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
          state: true,
          nodeCredential: true
        }
      }),
      xray.clientEnabledByEmail(),
      xray.onlineEmails()
    ]);

    const removed = await this.removeRevoked({ xray, peers, nodeClients });
    const restored = await this.restoreMissing({ xray, node, peers, nodeClients });
    const synced = await this.syncEnabled({ xray, peers, nodeClients });
    const collected = await this.collectOrphans({ xray, nodeId: node.id, peers, nodeClients, online });

    if (removed || restored || synced || collected) {
      await xray.restartCore();
    }
  }

  private async removeRevoked({ xray, peers, nodeClients }: RemoveRevokedInput): Promise<boolean> {
    const gone = peers.filter((peer) => peer.state === 'revoked');

    const doomed: string[] = [];

    for (const peer of gone) {
      const claimed = await this.prisma.peer.deleteMany({
        where: { id: peer.id, state: 'revoked' }
      });

      if (claimed.count === 0) {
        continue;
      }

      doomed.push(...this.namesOf(peer).filter((email) => nodeClients.has(email)));
    }

    await Promise.all(doomed.map((email) => xray.deleteClient(email)));

    return !isEmpty(doomed);
  }

  private async restoreMissing({ xray, node, peers, nodeClients }: RestoreMissingInput): Promise<boolean> {
    const missing = peers.filter((peer) => peer.state !== 'revoked' && !this.namesOf(peer).some((email) => nodeClients.has(email)));

    if (isEmpty(missing)) {
      return false;
    }

    let restored = 0;
    let failedCount = 0;

    for (const peer of missing) {
      const email = peerClientName(peer);

      try {
        await (peer.protocol === TUNNEL_PROTOCOL.vless
          ? xray.createVlessClient(email, peer.nodeCredential)
          : xray.createClient(email, peer.nodeCredential));

        nodeClients.set(email, true);
        restored += 1;
      } catch (error) {
        failedCount += 1;
        this.logger.warn(`restoring ${email} failed on node ${node.id}: ${describeError(error)}`);
      }
    }

    if (failedCount > 0) {
      this.logger.warn(`restoring ${failedCount} of ${missing.length} peer(s) failed on node ${node.id}`);
    }

    if (restored > 0) {
      this.logger.log(`restored ${restored} peer(s) missing from node ${node.id}`);
    }

    return restored > 0;
  }

  private async syncEnabled({ xray, peers, nodeClients }: SyncEnabledInput): Promise<boolean> {
    const toEnable: string[] = [];
    const toDisable: string[] = [];

    for (const peer of peers) {
      if (peer.state !== 'active' && peer.state !== 'disabled') {
        continue;
      }

      const email = this.namesOf(peer).find((candidate) => nodeClients.has(candidate));

      if (!email) {
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

  private async withoutAnOwner(emails: string[]): Promise<string[]> {
    if (isEmpty(emails)) {
      return [];
    }

    const owners = new Map(emails.map((email) => [email, ownerIdOf(email)]));
    const named = [...new Set([...owners.values()].filter(isNonNullish))];

    const alive = await this.prisma.user.findMany({
      where: { id: { in: named } },
      select: { id: true }
    });

    const living = new Set(alive.map((user) => user.id));

    return emails.filter((email) => {
      const owner = owners.get(email);

      return isNonNullish(owner) && !living.has(owner);
    });
  }

  private isServerOwned(email: string): boolean {
    return Object.values(PEER_PREFIX).some((prefix) => email.startsWith(prefix));
  }

  private async collectOrphans({ xray, nodeId, peers, nodeClients, online }: CollectOrphansInput): Promise<boolean> {
    if (online === null) {
      this.suspects.delete(nodeId);

      return false;
    }

    const known = new Set(peers.flatMap((peer) => this.namesOf(peer)));
    const seenBefore = this.suspects.get(nodeId) ?? new Set<string>();
    const seenNow = new Set<string>();

    const candidates: string[] = [];

    for (const email of nodeClients.keys()) {
      if (known.has(email) || !this.isServerOwned(email)) {
        continue;
      }

      if (!seenBefore.has(email)) {
        seenNow.add(email);

        continue;
      }

      candidates.push(email);
    }

    const doomed = await this.withoutAnOwner(candidates);

    await Promise.all(doomed.map((email) => xray.deleteClient(email)));

    const collected = !isEmpty(doomed);

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

    results.forEach((result, index) => {
      const nodeId = nodes[index].id;

      if (result.status === 'fulfilled') {
        this.failures.delete(nodeId);

        return;
      }

      this.noteFailure({ nodeId, reason: result.reason });
    });
  }

  private noteFailure({ nodeId, reason }: NoteFailureInput): void {
    const streak = (this.failures.get(nodeId) ?? 0) + 1;

    this.failures.set(nodeId, streak);

    const message = `Reconcile failed for node ${nodeId} (${streak} in a row): ${describeError(reason)}`;

    if (streak >= RECONCILE_FAILURE_ALERT_THRESHOLD) {
      this.logger.error(`${message}. Revoked peers on this node stay connected until it converges.`);

      return;
    }

    this.logger.warn(message);
  }
}
