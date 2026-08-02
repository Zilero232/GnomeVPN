import { readFile } from 'node:fs/promises';

import type { NodeConfig, NodeConfigIssues } from './nodes-config.types';

import { nodesConfigSchema } from './nodes-config.schema';

const formatIssues = (issues: NodeConfigIssues) =>
  issues.map((issue) => `index ${String(issue.path[0])}: ${issue.path.slice(1).join('.')} — ${issue.message}`).join('\n');

export const loadNodesConfig = async (filePath: string): Promise<NodeConfig[]> => {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const result = nodesConfigSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid nodes.json:\n${formatIssues(result.error.issues)}`);
  }

  return result.data;
};
