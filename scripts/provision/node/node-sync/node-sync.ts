import { SshClient } from '@gnomevpn/scripts/ssh';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { SyncToProductionInput } from './node-sync.types';

import { HEREDOC_NONCE_BYTES, PRODUCTION_SSH } from './node-sync.constants';
import { applySqlCommand, buildNodeSync, restartServerCommand } from './node-sync.helpers';

const defaultKeyPath = (): string | undefined =>
  PRODUCTION_SSH.keyNames.map((name) => join(homedir(), '.ssh', name)).find((path) => existsSync(path));

export const syncToProduction = async ({ nodes, envNodes }: SyncToProductionInput): Promise<string> => {
  const host = process.env.PROVISION_SSH_HOST;
  const username = process.env.PROVISION_SSH_USER ?? PRODUCTION_SSH.defaultUser;
  const password = process.env.PROVISION_SSH_PASSWORD;
  const privateKeyPath = process.env.PROVISION_SSH_KEY ?? defaultKeyPath();
  const deployPath = process.env.PROVISION_DEPLOY_PATH ?? PRODUCTION_SSH.defaultDeployPath;

  if (!host) {
    return 'skipped: PROVISION_SSH_HOST is not set';
  }

  if (!(password || privateKeyPath)) {
    return 'skipped: neither PROVISION_SSH_PASSWORD nor an ssh key is available';
  }

  if (nodes.length === 0) {
    return 'skipped: the local database holds no nodes';
  }

  const ssh = new SshClient();

  try {
    await ssh.connect({ host, username, password, privateKeyPath });
    await ssh.putFile({ content: envNodes, remotePath: `${deployPath}/.env.nodes` });

    const delimiter = `SQL_${randomBytes(HEREDOC_NONCE_BYTES).toString('hex')}`;
    const applied = await ssh.exec(applySqlCommand({ deployPath, sql: buildNodeSync(nodes), delimiter }));

    if (applied.exitCode !== 0) {
      return `failed: ${(applied.stderr || applied.stdout).trim()}`;
    }

    const restarted = await ssh.exec(restartServerCommand(deployPath));

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
