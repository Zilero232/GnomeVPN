import type { PrismaService } from '../../../../../../core';
import type { XrayClient } from '../../../../../../lib';
import type { ReconcilePeer } from '../../reconcile-peers.job.types';

export type ReleaseRevokedInput = {
  prisma: PrismaService;
  xray: XrayClient;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
};
