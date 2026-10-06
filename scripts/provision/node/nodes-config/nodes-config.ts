import { readFile } from 'node:fs/promises';

import type { NodeConfig } from './nodes-config.types';

import { formatIssues } from './nodes-config.helpers';
import { nodesConfigSchema } from './nodes-config.schema';

export const loadNodesConfig = async (filePath: string): Promise<NodeConfig[]> => {
  const raw = await readFile(filePath, 'utf8');
  const result = nodesConfigSchema.safeParse(JSON.parse(raw));

  if (!result.success) {
    throw new Error(`Invalid nodes.json:\n${formatIssues(result.error.issues)}`);
  }

  return result.data;
};
