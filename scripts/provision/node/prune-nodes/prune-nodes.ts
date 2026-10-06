import { prop } from 'remeda';

import type { PruneNodesInput, PruneNodesResult } from './prune-nodes.types';

import { pruneEnvKeys } from '../env-file';
import { PRUNED_SECRETS } from './prune-nodes.constants';

export const pruneNodes = async ({ prisma, nodes, serverEnvPath }: PruneNodesInput): Promise<PruneNodesResult> => {
  const countryCodes = nodes.map(prop('countryCode'));
  const removedKeys: string[] = [];

  for (const { prefix, name } of PRUNED_SECRETS) {
    removedKeys.push(...(await pruneEnvKeys({ filePath: serverEnvPath, prefix, keep: countryCodes.map(name) })));
  }

  const stale = await prisma.node.findMany({
    where: { host: { notIn: nodes.map(prop('host')) } },
    select: { id: true, host: true, country: true }
  });

  if (stale.length > 0) {
    await prisma.node.deleteMany({ where: { id: { in: stale.map(prop('id')) } } });
  }

  return {
    removedKeys,
    removedNodes: stale.map((node) => `${node.country} (${node.host})`)
  };
};
