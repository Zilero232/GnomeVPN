import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { describeError, resolveNodeApiKey } from '../../../common/lib';
import { PrismaService } from '../../../core';
import { WgEasyClient } from '../../../lib';

import type { ProbeNodeRow } from './jobs.types';

@Injectable()
export class NodeHealthJob {
  private readonly logger = new Logger(NodeHealthJob.name);

  constructor(private readonly prisma: PrismaService) {}

  private async probe(node: ProbeNodeRow): Promise<void> {
    const wg = new WgEasyClient({
      baseUrl: node.wgEasyUrl,
      apiKey: resolveNodeApiKey(node.wgEasyApiKeyRef),
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
      where: { enabled: true },
      select: { id: true, wgEasyUrl: true, wgEasyApiKeyRef: true },
    });

    const results = await Promise.allSettled(nodes.map((node) => this.probe(node)));

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Node probe failed: ${describeError(result.reason)}`);
      }
    }
  }
}
