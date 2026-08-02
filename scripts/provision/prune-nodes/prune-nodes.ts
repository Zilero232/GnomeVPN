import { prop } from 'remeda';

import type { PruneNodesInput, PruneNodesResult } from './prune-nodes.types';

import { pruneEnvKeys } from '../env-file';
import { NODE_KEY_PREFIX, nodeKeyName, PANEL_PASSWORD_PREFIX, panelPasswordName } from '../node-credentials';

export const pruneNodes = async ({ prisma, nodes, serverEnvPath }: PruneNodesInput): Promise<PruneNodesResult> => {
  const countryCodes = nodes.map(prop('countryCode'));

  const removedKeys = await pruneEnvKeys({
    filePath: serverEnvPath,
    prefix: NODE_KEY_PREFIX,
    keep: countryCodes.map(nodeKeyName)
  });

  const removedPasswords = await pruneEnvKeys({
    filePath: serverEnvPath,
    prefix: PANEL_PASSWORD_PREFIX,
    keep: countryCodes.map(panelPasswordName)
  });

  const stale = await prisma.node.findMany({
    where: { host: { notIn: nodes.map(prop('host')) } },
    select: { id: true, host: true, country: true }
  });

  if (stale.length > 0) {
    await prisma.node.deleteMany({ where: { id: { in: stale.map(prop('id')) } } });
  }

  return {
    removedKeys: [...removedKeys, ...removedPasswords],
    removedNodes: stale.map((node) => `${node.country} (${node.host})`)
  };
};
