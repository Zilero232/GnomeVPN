import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isNonNullish } from 'remeda';

import type { NoteLoadInput, ProbeNodeRow } from './node-health.job.types';

import { describeError, xrayClientForNode } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { ALERT } from '../../config';

@Injectable()
export class NodeHealthJob {
  private readonly logger = new Logger(NodeHealthJob.name);

  constructor(private readonly prisma: PrismaService) {}

  private async probe(node: ProbeNodeRow): Promise<void> {
    const health = await xrayClientForNode(node)
      .health()
      .catch((error: unknown) => {
        throw new Error(`${node.apiUrl}: ${describeError(error)}`);
      });

    this.noteLoad({ node, health });

    if (!health.isHealthy) {
      this.logger.warn(`node ${node.apiUrl} answered but its inbound is disabled`);

      return;
    }

    await this.prisma.node.update({
      where: { id: node.id },
      data: { lastHealthyAt: new Date() }
    });
  }

  private noteLoad({ node, health }: NoteLoadInput): void {
    if (isNonNullish(health.cpu) && health.cpu >= ALERT.nodeCpuPercent) {
      this.logger.warn(`node ${node.apiUrl} is at ${health.cpu.toFixed(0)}% cpu`);
    }

    if (isNonNullish(health.memoryRatio) && health.memoryRatio >= ALERT.nodeMemoryRatio) {
      this.logger.warn(`node ${node.apiUrl} is at ${(health.memoryRatio * 100).toFixed(0)}% memory`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    const nodes = await this.prisma.node.findMany({
      where: { isAvailable: true },
      select: { id: true, apiUrl: true, apiTokenEnvVar: true }
    });

    const results = await Promise.allSettled(nodes.map((node) => this.probe(node)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Node probe failed: ${describeError(result.reason)}`);
      }
    }
  }
}
