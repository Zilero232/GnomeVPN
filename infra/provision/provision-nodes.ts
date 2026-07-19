import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNonNullish, prop } from 'remeda';

import { upsertNode } from '../../apps/server/scripts/lib/upsert-node';
import { basePrisma } from '../../apps/server/src/core';
import { WgEasyClient } from '../../apps/server/src/lib/wg-easy';
import { loadNodesConfig } from './lib/nodes-config';
import { provisionHost } from './lib/provision-host';

import type { PrismaLike } from '../../apps/server/scripts/lib/upsert-node';
import type { ProvisionResult } from './lib/provision-host';

const prisma = basePrisma as unknown as PrismaLike;

const HERE = fileURLToPath(new URL('.', import.meta.url));
const NODES_CONFIG_PATH = resolve(HERE, 'nodes.json');
const WG_EASY_COMPOSE_PATH = resolve(HERE, '..', 'wg-easy', 'docker-compose.yml');
const SERVER_ENV_PATH = resolve(HERE, '..', '..', 'apps', 'server', '.env');

const BACKEND_IP_FLAG = '--backend-ip=';

const parseBackendIp = (argv: string[]): string | undefined =>
  argv.find((arg) => arg.startsWith(BACKEND_IP_FLAG))?.slice(BACKEND_IP_FLAG.length);

const healthCheck = async (opts: { baseUrl: string; apiKey: string }): Promise<boolean> =>
  new WgEasyClient(opts).health();

const formatResultLine = (result: ProvisionResult): string => {
  const suffix = isNonNullish(result.error) ? ` (${result.error})` : '';

  return `  ${result.country.padEnd(20)} ${result.host.padEnd(16)} ${result.status}${suffix}`;
};

const provisionAll = async (backendIp: string | undefined): Promise<ProvisionResult[]> => {
  const nodes = await loadNodesConfig(NODES_CONFIG_PATH);
  const wgEasyComposeContent = await readFile(WG_EASY_COMPOSE_PATH, 'utf8');

  const results: ProvisionResult[] = [];

  for (const node of nodes) {
    process.stdout.write(`Provisioning ${node.country} (${node.host})...\n`);

    const result = await provisionHost(node, {
      backendIp,
      serverEnvPath: SERVER_ENV_PATH,
      wgEasyComposeContent,
      healthCheck,
      upsertNode,
      basePrisma: prisma,
    });

    results.push(result);
    process.stdout.write(`  -> ${result.status}${result.error ? `: ${result.error}` : ''}\n`);
  }

  return results;
};

const main = async (): Promise<void> => {
  const backendIp = parseBackendIp(process.argv.slice(2));

  if (!backendIp) {
    process.stdout.write(
      'Warning: --backend-ip was not provided. The wg-easy REST port will be opened to all sources on every node.\n',
    );
  }

  const results = await provisionAll(backendIp);

  process.stdout.write('\nSummary:\n');
  process.stdout.write(`${results.map(formatResultLine).join('\n')}\n`);

  await basePrisma.$disconnect();

  process.exitCode = results.map(prop('status')).includes('failed') ? 1 : 0;
};

void main();
