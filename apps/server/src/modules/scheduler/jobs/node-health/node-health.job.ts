import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { describeError, resolveNodeApiKey } from '../../../../common/lib';
import { PrismaService } from '../../../../core';
import { WgEasyClient } from '../../../../lib';

import type { ProbeNodeRow } from './node-health.job.types';

@Injectable()
export class NodeHealthJob {
  private readonly logger = new Logger(NodeHealthJob.name);

  constructor(private readonly prisma: PrismaService) {}

  private async probe(node: ProbeNodeRow): Promise<void> {
    const wg = new WgEasyClient({
      baseUrl: node.wgEasyUrl,
      apiKey: resolveNodeApiKey(node.wgEasyApiKeyEnvVar),
    });

    if (!(await wg.health())) {
      return;
    }

    await this.prisma.node.update({
      where: { id: node.id },
      data: { lastHealthyAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    const nodes = await this.prisma.node.findMany({
      where: { isAvailable: true },
      select: { id: true, wgEasyUrl: true, wgEasyApiKeyEnvVar: true },
    });

    const results = await Promise.allSettled(nodes.map((node) => this.probe(node)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Node probe failed: ${describeError(result.reason)}`);
      }
    }
  }
}
