import type { NodeConfig } from '../nodes-config';
import type { PrismaLike } from '../upsert-node';

export type PruneNodesInput = {
  prisma: PrismaLike;
  nodes: NodeConfig[];
  serverEnvPath: string;
};

export type PruneNodesResult = {
  removedKeys: string[];
  removedNodes: string[];
};
