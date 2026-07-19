import { match } from 'ts-pattern';

import { appendEnvLine, hasEnvKey } from '../env-file';
import { hashPanelPassword, resolvePanelPassword } from '../panel-password';
import { SshClient } from '../ssh-client';

import type { NodeConfig } from '../nodes-config';
import type { ProvisionHostOptions, ProvisionResult } from './provision-host.types';

const REMOTE_DIR = '/opt/vesper-wg-easy';
const WIREGUARD_PORT = 51820;
const PANEL_PORT = 51821;
const HEALTH_CHECK_TIMEOUT_MS = 60_000;
const HEALTH_CHECK_INTERVAL_MS = 2_000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForHealthy = async (
  check: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) {
      return true;
    }

    await sleep(intervalMs);
  }

  return false;
};

const ensureDocker = async (ssh: SshClient): Promise<void> => {
  const dockerCheck = await ssh.exec('docker --version');

  if (dockerCheck.exitCode !== 0) {
    await ssh.exec('curl -fsSL https://get.docker.com | sh');
  }
};

const shipComposeStack = async (
  ssh: SshClient,
  config: NodeConfig,
  composeContent: string,
  passwordHash: string,
): Promise<void> => {
  await ssh.exec(`mkdir -p ${REMOTE_DIR}`);

  await ssh.putFile(composeContent, `${REMOTE_DIR}/docker-compose.yml`);
  await ssh.putFile(
    `WG_HOST=${config.host}\nWG_EASY_PASSWORD_HASH=${passwordHash}\nWG_DEFAULT_DNS=1.1.1.1\n`,
    `${REMOTE_DIR}/.env`,
  );
};

const panelFirewallRule = (backendIp: string | undefined): string =>
  match(backendIp)
    .with(undefined, () => `ufw allow ${PANEL_PORT}/tcp`)
    .otherwise((ip) => `ufw allow from ${ip} to any port ${PANEL_PORT} proto tcp`);

const configureFirewall = async (ssh: SshClient, backendIp: string | undefined): Promise<void> => {
  const ufwCheck = await ssh.exec('command -v ufw');

  if (ufwCheck.exitCode !== 0) {
    return;
  }

  await ssh.exec(`ufw allow ${WIREGUARD_PORT}/udp`);
  await ssh.exec(panelFirewallRule(backendIp));
};

const registerPanelPassword = async (
  serverEnvPath: string,
  countryCode: string,
  password: string,
  isNew: boolean,
): Promise<void> => {
  if (!isNew) {
    return;
  }

  if (await hasEnvKey(serverEnvPath, `WG_KEY_${countryCode}`)) {
    return;
  }

  await appendEnvLine(serverEnvPath, `WG_KEY_${countryCode}`, password);
};

export const provisionHost = async (
  config: NodeConfig,
  opts: ProvisionHostOptions,
): Promise<ProvisionResult> => {
  const ssh = (opts.createSshClient ?? (() => new SshClient()))();

  try {
    await ssh.connect({
      host: config.host,
      username: config.sshUser,
      password: config.sshPassword,
    });

    await ensureDocker(ssh);

    const { password, isNew } = await resolvePanelPassword(opts.serverEnvPath, config.countryCode);
    const passwordHash = await hashPanelPassword(password);

    await shipComposeStack(ssh, config, opts.wgEasyComposeContent, passwordHash);
    await configureFirewall(ssh, opts.backendIp);
    await ssh.exec(`cd ${REMOTE_DIR} && docker compose up -d`);

    const healthy = await waitForHealthy(
      () => opts.healthCheck({ baseUrl: `http://${config.host}:${PANEL_PORT}`, apiKey: password }),
      opts.healthCheckTimeoutMs ?? HEALTH_CHECK_TIMEOUT_MS,
      opts.healthCheckIntervalMs ?? HEALTH_CHECK_INTERVAL_MS,
    );

    if (!healthy) {
      return {
        host: config.host,
        country: config.country,
        status: 'failed',
        error: 'wg-easy health check did not succeed within the timeout',
      };
    }

    await registerPanelPassword(opts.serverEnvPath, config.countryCode, password, isNew);

    const upsertResult = await opts.upsertNode(opts.basePrisma, {
      country: config.country,
      countryCode: config.countryCode,
      flagEmoji: config.flagEmoji,
      city: config.city,
      publicEndpoint: `${config.host}:${WIREGUARD_PORT}`,
      wgEasyUrl: `http://${config.host}:${PANEL_PORT}`,
      wgEasyApiKeyRef: `WG_KEY_${config.countryCode}`,
    });

    return {
      host: config.host,
      country: config.country,
      status: upsertResult.wasExisting ? 'updated' : 'provisioned',
    };
  } catch (error) {
    return {
      host: config.host,
      country: config.country,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    ssh.dispose();
  }
};
