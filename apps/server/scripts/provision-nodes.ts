import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNonNullish, prop } from 'remeda';

import { basePrisma } from '../src/core';
import { XrayClient } from '../src/lib/xray';
import { pruneEnvKeys } from './lib/env-file';
import {
  NODE_KEY_PREFIX,
  nodeKeyName,
  PANEL_PASSWORD_PREFIX,
  panelPasswordName,
} from './lib/node-credentials';
import { loadNodesConfig } from './lib/nodes-config';
import { provisionHost } from './lib/provision-host';
import { upsertNode } from './lib/upsert-node';

import type { ProvisionResult } from './lib/provision-host';
import type { PrismaLike } from './lib/upsert-node';

const prisma = basePrisma as unknown as PrismaLike;

const HERE = fileURLToPath(new URL('.', import.meta.url));
const NODES_CONFIG_PATH = resolve(HERE, '..', 'nodes.json');
const XRAY_COMPOSE_PATH = resolve(HERE, '..', '..', '..', 'infra', 'xray', 'docker-compose.yml');
const SERVER_ENV_PATH = resolve(HERE, '..', '.env.nodes');

const healthCheck = async (opts: { baseUrl: string; token: string }): Promise<boolean> =>
  new XrayClient(opts).isReachable();

const ensureInbound = async ({
  baseUrl,
  token,
  inbound,
}: {
  baseUrl: string;
  token: string;
  inbound: Record<string, unknown>;
}): Promise<void> => {
  const xray = new XrayClient({ baseUrl, token });

  if (await xray.hasInbound()) {
    await xray.updateInbound(inbound);

    return;
  }

  await xray.createInbound(inbound);
};

const formatResultLine = (result: ProvisionResult): string => {
  const suffix = isNonNullish(result.error) ? ` (${result.error})` : '';

  return `  ${result.country.padEnd(20)} ${result.host.padEnd(16)} ${result.status}${suffix}`;
};

const pruneRemovedNodes = async (countryCodes: string[]): Promise<void> => {
  const removedKeys = await pruneEnvKeys({
    filePath: SERVER_ENV_PATH,
    prefix: NODE_KEY_PREFIX,
    keep: countryCodes.map(nodeKeyName),
  });

  const removedPasswords = await pruneEnvKeys({
    filePath: SERVER_ENV_PATH,
    prefix: PANEL_PASSWORD_PREFIX,
    keep: countryCodes.map(panelPasswordName),
  });

  const removed = [...removedKeys, ...removedPasswords];

  if (removed.length > 0) {
    process.stdout.write(`Removed stale keys: ${removed.join(', ')}\n`);
  }

  const disabled = await basePrisma.node.updateMany({
    where: { countryCode: { notIn: countryCodes }, isAvailable: true },
    data: { isAvailable: false },
  });

  if (disabled.count > 0) {
    process.stdout.write(`Disabled ${disabled.count} node(s) missing from nodes.json\n`);
  }
};

const provisionAll = async (): Promise<ProvisionResult[]> => {
  const nodes = await loadNodesConfig(NODES_CONFIG_PATH);
  const xrayComposeContent = await readFile(XRAY_COMPOSE_PATH, 'utf8');

  const results: ProvisionResult[] = [];

  for (const node of nodes) {
    process.stdout.write(`Provisioning ${node.country} (${node.host})...\n`);

    const result = await provisionHost({
      config: node,
      options: {
        serverEnvPath: SERVER_ENV_PATH,
        xrayComposeContent,
        healthCheck,
        ensureInbound,
        upsertNode,
        basePrisma: prisma,
      },
    });

    results.push(result);
    process.stdout.write(`  -> ${result.status}${result.error ? `: ${result.error}` : ''}\n`);
  }

  if (!results.map(prop('status')).includes('failed')) {
    await pruneRemovedNodes(nodes.map(prop('countryCode')));
  }

  return results;
};

const main = async (): Promise<void> => {
  const results = await provisionAll();

  process.stdout.write('\nSummary:\n');
  process.stdout.write(`${results.map(formatResultLine).join('\n')}\n`);

  await basePrisma.$disconnect();

  process.exitCode = results.map(prop('status')).includes('failed') ? 1 : 0;
};

void main();
