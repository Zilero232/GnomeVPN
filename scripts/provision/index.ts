import { reporter } from '@gnomevpn/scripts/reporter';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prop } from 'remeda';

import type { NodeConfig } from './nodes-config';
import type { ProvisionResult } from './provision-host';

import { basePrisma } from '../../apps/server/src/core';
import { syncToProduction } from './node-sync';
import { loadNodesConfig } from './nodes-config';
import { provisionHost } from './provision-host';
import { formatSummary } from './provision-report';
import { pruneNodes } from './prune-nodes';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const NODES_CONFIG_PATH = resolve(ROOT, 'nodes.json');
const SERVER_ENV_PATH = resolve(ROOT, '.env.nodes');
const XRAY_COMPOSE_PATH = resolve(ROOT, 'infra', 'xray', 'docker-compose.yml');

const log = reporter('provision');

const provisionAll = async (nodes: NodeConfig[]): Promise<ProvisionResult[]> => {
  const xrayComposeContent = await readFile(XRAY_COMPOSE_PATH, 'utf8');
  const results: ProvisionResult[] = [];

  for (const config of nodes) {
    log.step(`${config.country} (${config.host})`);

    const result = await provisionHost({
      config,
      prisma: basePrisma,
      serverEnvPath: SERVER_ENV_PATH,
      xrayComposeContent
    });

    results.push(result);
    log.info(`  ${result.status}${result.error ? `: ${result.error}` : ''}`);

    if (result.lostWireguardKeys) {
      log.warn('  the wireguard server key was missing and had to be regenerated');
      log.warn('  every wireguard config issued for this node before now is dead');
    }
  }

  return results;
};

const pruneStale = async (nodes: NodeConfig[]): Promise<void> => {
  const { removedKeys, removedNodes } = await pruneNodes({
    prisma: basePrisma,
    nodes,
    serverEnvPath: SERVER_ENV_PATH
  });

  if (removedKeys.length > 0) {
    log.info(`removed stale keys: ${removedKeys.join(', ')}`);
  }

  if (removedNodes.length > 0) {
    log.info(`removed ${removedNodes.length} node(s) missing from nodes.json: ${removedNodes.join(', ')}`);
  }
};

const pushToProduction = async (): Promise<void> => {
  const nodes = await basePrisma.node.findMany({ orderBy: { createdAt: 'asc' } });
  const envNodes = await readFile(SERVER_ENV_PATH, 'utf8');

  log.step('syncing production');
  log.info(`  ${await syncToProduction({ nodes, envNodes })}`);
};

const main = async (): Promise<void> => {
  const nodes = await loadNodesConfig(NODES_CONFIG_PATH);
  const results = await provisionAll(nodes);
  const hasFailed = results.map(prop('status')).includes('failed');

  log.info(`\nsummary:\n${formatSummary(results)}`);

  if (!hasFailed) {
    await pruneStale(nodes);
    await pushToProduction();
  }

  await basePrisma.$disconnect();

  process.exitCode = hasFailed ? 1 : 0;
};

await main();
