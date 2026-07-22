import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prop } from 'remeda';

import { basePrisma } from '../src/core';
import { syncToProduction } from './lib/node-sync';
import { loadNodesConfig } from './lib/nodes-config';
import { provisionHost } from './lib/provision-host';
import { formatSummary } from './lib/provision-report';
import { pruneNodes } from './lib/prune-nodes';

import type { NodeConfig } from './lib/nodes-config';
import type { ProvisionResult } from './lib/provision-host';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const NODES_CONFIG_PATH = resolve(HERE, '..', 'nodes.json');
const XRAY_COMPOSE_PATH = resolve(HERE, '..', '..', '..', 'infra', 'xray', 'docker-compose.yml');
const SERVER_ENV_PATH = resolve(HERE, '..', '.env.nodes');

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const provisionAll = async (nodes: NodeConfig[]): Promise<ProvisionResult[]> => {
  const xrayComposeContent = await readFile(XRAY_COMPOSE_PATH, 'utf8');
  const results: ProvisionResult[] = [];

  for (const config of nodes) {
    write(`Provisioning ${config.country} (${config.host})...`);

    const result = await provisionHost({
      config,
      prisma: basePrisma,
      serverEnvPath: SERVER_ENV_PATH,
      xrayComposeContent,
    });

    results.push(result);
    write(`  -> ${result.status}${result.error ? `: ${result.error}` : ''}`);
  }

  return results;
};

const pruneStale = async (nodes: NodeConfig[]): Promise<void> => {
  const { removedKeys, removedNodes } = await pruneNodes({
    prisma: basePrisma,
    nodes,
    serverEnvPath: SERVER_ENV_PATH,
  });

  if (removedKeys.length > 0) {
    write(`Removed stale keys: ${removedKeys.join(', ')}`);
  }

  if (removedNodes.length > 0) {
    write(
      `Removed ${removedNodes.length} node(s) missing from nodes.json: ${removedNodes.join(', ')}`,
    );
  }
};

const pushToProduction = async (): Promise<void> => {
  const nodes = await basePrisma.node.findMany({ orderBy: { createdAt: 'asc' } });
  const envNodes = await readFile(SERVER_ENV_PATH, 'utf8');

  write('\nSyncing production...');
  write(`  -> ${await syncToProduction({ nodes, envNodes })}`);
};

const main = async (): Promise<void> => {
  const nodes = await loadNodesConfig(NODES_CONFIG_PATH);
  const results = await provisionAll(nodes);
  const hasFailed = results.map(prop('status')).includes('failed');

  write('\nSummary:');
  write(formatSummary(results));

  if (!hasFailed) {
    await pruneStale(nodes);
    await pushToProduction();
  }

  await basePrisma.$disconnect();

  process.exitCode = hasFailed ? 1 : 0;
};

await main();
