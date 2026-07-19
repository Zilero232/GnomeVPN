import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';

@Injectable()
export class NodeHealthJob {
  constructor(private readonly prisma: PrismaService) {}

  makeClient(baseUrl: string, apiKey: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey });
  }

  private async probe(node: {
    id: string;
    wgEasyUrl: string;
    wgEasyApiKeyRef: string;
  }): Promise<void> {
    const apiKey = process.env[node.wgEasyApiKeyRef];

    if (!apiKey) {
      return;
    }

    const isHealthy = await this.makeClient(node.wgEasyUrl, apiKey).health();

    if (!isHealthy) {
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

    await Promise.allSettled(nodes.map((node) => this.probe(node)));
  }
}
