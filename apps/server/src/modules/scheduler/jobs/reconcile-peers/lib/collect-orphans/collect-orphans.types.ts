import type { PrismaService } from '../../../../../../core';
import type { XrayClient } from '../../../../../../lib';
import type { ReconcilePeer } from '../../reconcile-peers.job.types';

export type CollectOrphansInput = {
  prisma: PrismaService;
  xray: XrayClient;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
  online: Set<string> | null;
};

export type WithoutAnOwnerInput = {
  prisma: PrismaService;
  emails: string[];
};
