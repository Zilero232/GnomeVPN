import type { PrismaService } from '../../../../../../core';
import type { XrayClient } from '../../../../../../lib';
import type { ReconcilePeer } from '../../reconcile-peers.job.types';

export type ReleaseLegacyInput = {
  prisma: PrismaService;
  xray: XrayClient;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
  online: Set<string> | null;
  now: Date;
};

export type IsLegacyPeerInput = {
  peer: ReconcilePeer;
  replaced: Set<string>;
};
