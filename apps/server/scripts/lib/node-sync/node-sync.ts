import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { SyncableNode, SyncToProductionInput } from './node-sync.types';

import { SshClient } from '../ssh-client';
import { SSH_KEY_NAMES } from './node-sync.constants';

const defaultKeyPath = (): string | undefined =>
  SSH_KEY_NAMES.map((name) => join(homedir(), '.ssh', name)).find((path) => existsSync(path));

const quote = (value: string | null): string =>
  value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`;

const row = (node: SyncableNode): string =>
  [
    quote(node.country),
    quote(node.countryCode),
    quote(node.city),
    quote(node.host),
    String(node.port),
    quote(node.serverName),
    quote(node.hysteriaAuth),
    quote(node.wgPublicKey),
    quote(node.apiUrl),
    quote(node.apiTokenEnvVar),
    String(node.displayOrder)
  ].join(', ');

const buildNodeSync = (nodes: SyncableNode[]): string => {
  const values = nodes.map((node) => `  (${row(node)})`).join(',\n');
  const hosts = nodes.map((node) => quote(node.host)).join(', ');

  return [
    'BEGIN;',
    '',
    'CREATE TEMP TABLE incoming_node (',
    '  country text, country_code text, city text, host text, port int,',
    '  server_name text, hysteria_auth text,',
    '  wg_public_key text,',
    '  api_url text, api_token_env_var text, display_order int',
    ') ON COMMIT DROP;',
    '',
    'INSERT INTO incoming_node VALUES',
    `${values};`,
    '',
    `DELETE FROM node WHERE host NOT IN (${hosts});`,
    '',
    'DELETE FROM peer WHERE node_id IN (',
    '  SELECT n.id FROM node n JOIN incoming_node i ON n.host = i.host',
    '  WHERE n.port <> i.port OR n.server_name <> i.server_name',
    ');',
    '',
    'UPDATE node SET',
    '  country = i.country, country_code = i.country_code, city = i.city,',
    '  port = i.port, server_name = i.server_name, hysteria_auth = i.hysteria_auth,',
    '  wg_public_key = i.wg_public_key,',
    '  api_url = i.api_url, api_token_env_var = i.api_token_env_var,',
    '  display_order = i.display_order, is_available = true',
    'FROM incoming_node i WHERE node.host = i.host;',
    '',
    'INSERT INTO node (',
    '  country, country_code, city, host, port, server_name, hysteria_auth,',
    '  wg_public_key,',
    '  api_url, api_token_env_var, display_order, is_available',
    ')',
    'SELECT',
    '  i.country, i.country_code, i.city, i.host, i.port, i.server_name, i.hysteria_auth,',
    '  i.wg_public_key,',
    '  i.api_url, i.api_token_env_var, i.display_order, true',
    'FROM incoming_node i',
    'WHERE NOT EXISTS (SELECT 1 FROM node n WHERE n.host = i.host);',
    '',
    'COMMIT;'
  ].join('\n');
};

export const syncToProduction = async ({
  nodes,
  envNodes
}: SyncToProductionInput): Promise<string> => {
  const host = process.env.PROVISION_SSH_HOST;
  const username = process.env.PROVISION_SSH_USER ?? 'root';
  const password = process.env.PROVISION_SSH_PASSWORD;
  const privateKeyPath = process.env.PROVISION_SSH_KEY ?? defaultKeyPath();
  const deployPath = process.env.PROVISION_DEPLOY_PATH ?? '/opt/gnomevpn';

  if (!host) {
    return 'skipped: PROVISION_SSH_HOST is not set';
  }

  if (!(password || privateKeyPath)) {
    return 'skipped: neither PROVISION_SSH_PASSWORD nor an ssh key is available';
  }

  const ssh = new SshClient();

  try {
    await ssh.connect({ host, username, password, privateKeyPath });
    await ssh.putFile(envNodes, `${deployPath}/.env.nodes`);

    const applied = await ssh.exec(
      [
        `cd ${deployPath} &&`,
        'docker compose exec -T postgres',
        'sh -c \'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"\'',
        `<<'SQL'\n${buildNodeSync(nodes)}\nSQL`
      ].join(' ')
    );

    if (applied.exitCode !== 0) {
      return `failed: ${(applied.stderr || applied.stdout).trim()}`;
    }

    const restarted = await ssh.exec(`cd ${deployPath} && docker compose restart server`);

    if (restarted.exitCode !== 0) {
      return `nodes written, restart failed: ${(restarted.stderr || restarted.stdout).trim()}`;
    }

    return `synced ${nodes.length} node(s) and restarted the server`;
  } catch (error) {
    return `failed: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    ssh.dispose();
  }
};
