import { readFile } from 'node:fs/promises';

import { nodesConfigSchema } from './nodes-config.schema';

import type { NodeConfigIssues } from './nodes-config.types';

const formatIssues = (issues: NodeConfigIssues): string =>
  issues
    .map(
      (issue) =>
        `index ${String(issue.path[0])}: ${issue.path.slice(1).join('.')} — ${issue.message}`,
    )
    .join('\n');

export const loadNodesConfig = async (filePath: string): Promise<NodeConfig[]> => {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const result = nodesConfigSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid apps/server/nodes.json:\n${formatIssues(result.error.issues)}`);
  }

  return result.data;
};
