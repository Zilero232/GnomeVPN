import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prop } from 'remeda';

import type { NodeConfig } from './node';
import type { ProvisionResult } from './pipeline';

import { basePrisma } from '../../apps/server/src/core';
import { log } from './config';
import { loadNodesConfig, pruneNodes, syncToProduction } from './node';
import { formatSummary, provisionHost } from './pipeline';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const NODES_CONFIG_PATH = resolve(ROOT, 'nodes.json');
const SERVER_ENV_PATH = resolve(ROOT, '.env.nodes');
const XRAY_COMPOSE_PATH = resolve(ROOT, 'infra', 'xray', 'docker-compose.yml');

const provisionAll = async (nodes: NodeConfig[]): Promise<ProvisionResult[]> => {
  const xrayComposeContent = await readFile(XRAY_COMPOSE_PATH, 'utf8');
  const results: ProvisionResult[] = [];

  for (const config of nodes) {
    log.tint(config.host);
    log.step(`${config.country} (${config.host})`);

    const result = await provisionHost({
      config,
      prisma: basePrisma,
      serverEnvPath: SERVER_ENV_PATH,
      xrayComposeContent
    });

    results.push(result);
    log.done(`${result.status}${result.error ? `: ${result.error}` : ''}`);

    if (result.lostRealityKeys) {
      log.warn('the reality server key was missing and had to be regenerated');
      log.warn('every VLESS entry issued for this node before now is dead');
    }

    log.untint();
  }

  return results;
};

const pruneStale = async (nodes: NodeConfig[]) => {
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

const pushToProduction = async () => {
  const nodes = await basePrisma.node.findMany({ orderBy: { createdAt: 'asc' } });
  const envNodes = await readFile(SERVER_ENV_PATH, 'utf8');

  log.step('syncing production');
  log.done(await syncToProduction({ nodes, envNodes }));
};

const main = async () => {
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
