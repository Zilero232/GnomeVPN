import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import type { NoteFailureInput, ReconcileNodeInput } from './reconcile-peers.job.types';

import { describeError, IDENTIFIED_NODE_SELECT, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { ALERT, SCHEDULE } from '../../config';
import { collectOrphans, restoreMissing, syncEnabled } from './lib';
import { RECONCILE_PEER_SELECT } from './reconcile-peers.job.constants';

@Injectable()
export class ReconcilePeersJob {
  private readonly logger = new Logger(ReconcilePeersJob.name);
  private readonly bootedAt = Date.now();
  private readonly failures = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private async reconcileNode({ node, withOrphans }: ReconcileNodeInput): Promise<void> {
    const xray = xrayClientForNode(node);

    const [peers, nodeClients, online] = await Promise.all([
      this.prisma.peer.findMany({ where: { nodeId: node.id }, select: RECONCILE_PEER_SELECT }),
      xray.clientEnabledByEmail(),
      withOrphans ? xray.onlineEmails() : Promise.resolve(null)
    ]);

    const restored = await restoreMissing({ logger: this.logger, xray, node, peers, nodeClients });
    const synced = await syncEnabled({ xray, peers, nodeClients });

    const collected = await collectOrphans({ prisma: this.prisma, xray, peers, nodeClients, online });

    if (restored || synced || collected) {
      await xray.restartCore();
    }
  }

  private async sweep(withOrphans: boolean): Promise<void> {
    const nodes = await this.prisma.node.findMany({ select: IDENTIFIED_NODE_SELECT });

    const results = await Promise.allSettled(nodes.map((node) => this.reconcileNode({ node, withOrphans })));

    results.forEach((result, index) => {
      const nodeId = nodes[index].id;

      if (result.status === 'fulfilled') {
        this.failures.delete(nodeId);

        return;
      }

      this.noteFailure({ nodeId, reason: result.reason });
    });
  }

  @Cron(SCHEDULE.reconcileCron)
  async run(): Promise<void> {
    if (Date.now() - this.bootedAt < SCHEDULE.bootGraceMs) {
      return;
    }

    await this.sweep(false);
  }

  @Cron(SCHEDULE.collectOrphansCron)
  async collect(): Promise<void> {
    if (Date.now() - this.bootedAt < SCHEDULE.bootGraceMs) {
      return;
    }

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
