import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isEmpty, isNullish, unique } from 'remeda';

import type { NoteFailureInput, ReconcileNodeInput } from './reconcile-peers.job.types';

import { describeError, IDENTIFIED_NODE_SELECT, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { LEGACY_PEER } from '../../../devices';
import { TelegramNotifyService } from '../../../telegram/services/telegram-notify.service';
import { ALERT, SCHEDULE } from '../../config';
import { collectOrphans, releaseLegacy, releaseRevoked, restoreMissing, syncEnabled } from './lib';
import { RECONCILE_PEER_SELECT } from './reconcile-peers.job.constants';

@Injectable()
export class ReconcilePeersJob {
  private readonly logger = new Logger(ReconcilePeersJob.name);
  private readonly bootedAt = Date.now();
  private readonly failures = new Map<string, number>();
  private running: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: TelegramNotifyService
  ) {}

  private async reconcileNode({ node, withOrphans }: ReconcileNodeInput): Promise<string[]> {
    const xray = xrayClientForNode(node);

    const [peers, nodeClients, online] = await Promise.all([
      this.prisma.peer.findMany({ where: { nodeId: node.id }, select: RECONCILE_PEER_SELECT }),
      xray.clientEnabledByEmail(),
      withOrphans ? xray.onlineEmails() : Promise.resolve(null)
    ]);

    const released = await releaseRevoked({ prisma: this.prisma, xray, peers, nodeClients });
    const retired = await releaseLegacy({ prisma: this.prisma, xray, peers, nodeClients, online, now: new Date() });
    const retiredIds = new Set(retired.map((peer) => peer.id));
    const live = peers.filter((peer) => isNullish(peer.revokedAt) && !retiredIds.has(peer.id));

    const restored = await restoreMissing({ logger: this.logger, xray, node, peers: live, nodeClients });
    const synced = await syncEnabled({ xray, peers: live, nodeClients });

    const collected = await collectOrphans({ prisma: this.prisma, xray, peers, nodeClients, online });

    if (released || !isEmpty(retired) || restored || synced || collected) {
      await xray.restartCore();
    }

    return unique(retired.map((peer) => peer.userId));
  }

  private async sweep(withOrphans: boolean): Promise<void> {
    if (Date.now() - this.bootedAt < SCHEDULE.bootGraceMs || (this.running && !withOrphans)) {
      return;
    }

    while (this.running) {
      await this.running.catch(() => undefined);
    }

    this.running = this.sweepNodes(withOrphans);

    try {
      await this.running;
    } finally {
      this.running = null;
    }
  }

  private async sweepNodes(withOrphans: boolean): Promise<void> {
    const nodes = await this.prisma.node.findMany({ select: IDENTIFIED_NODE_SELECT });

    const results = await Promise.allSettled(nodes.map((node) => this.reconcileNode({ node, withOrphans })));
    const retiredOwners: string[] = [];

    results.forEach((result, index) => {
      const nodeId = nodes[index].id;

      if (result.status === 'fulfilled') {
        this.failures.delete(nodeId);
        retiredOwners.push(...result.value);

        return;
      }

      this.noteFailure({ nodeId, reason: result.reason });
    });

    await this.announceRetired(unique(retiredOwners));
  }

  private async announceRetired(owners: string[]): Promise<void> {
    if (isEmpty(owners)) {
      return;
    }

    const remaining = await this.prisma.peer.findMany({
      where: { userId: { in: owners }, kind: 'config', name: LEGACY_PEER.name, deviceId: null },
      distinct: ['userId'],
      select: { userId: true }
    });

    const holding = new Set(remaining.map((peer) => peer.userId));
    const done = owners.filter((userId) => !holding.has(userId));

    this.logger.log(`Retired the shared feed keys of ${owners.length} account(s)`);

    await Promise.all(done.map((userId) => this.notify.tell({ userId, pick: (copy) => copy.legacyRetired })));
  }

  @Cron(SCHEDULE.reconcileCron)
  async run(): Promise<void> {
    await this.sweep(false);
  }

  @Cron(SCHEDULE.collectOrphansCron)
  async collect(): Promise<void> {
    await this.sweep(true);
  }

  private noteFailure({ nodeId, reason }: NoteFailureInput): void {
    const streak = (this.failures.get(nodeId) ?? 0) + 1;

    this.failures.set(nodeId, streak);

    const message = `Reconcile failed for node ${nodeId} (${streak} in a row): ${describeError(reason)}`;

    if (streak >= ALERT.reconcileFailureStreak) {
      this.logger.error(`${message}. Revoked peers on this node stay connected until it converges.`);

      return;
    }

    this.logger.warn(message);
  }
}
