import pWaitFor from 'p-wait-for';

import { upsertEnvLine } from '../env-file';
import { nodeKeyName, panelPasswordName, resolveNodeCredentials } from '../node-credentials';
import { buildRealityInbound, LISTEN_PORT, PANEL_PATH, PANEL_PORT } from '../reality-inbound';
import { generateRealityKeys, generateShortId } from '../reality-keys';
import { configurePanel, ensureDocker, openTunnelPort, shipStack } from '../remote-setup';
import { SshClient } from '../ssh-client';
import { HEALTH_INTERVAL_MS, HEALTH_TIMEOUT_MS } from './provision-host.constants';

import type {
  ProvisionHostInput,
  ProvisionResult,
  RememberNodeSecretsInput,
} from './provision-host.types';

const panelUrl = (host: string): string => `http://${host}:${PANEL_PORT}/${PANEL_PATH}`;

const rememberNodeSecrets = async ({
  serverEnvPath,
  countryCode,
  apiToken,
  panelPassword,
}: RememberNodeSecretsInput): Promise<void> => {
  await upsertEnvLine({
    filePath: serverEnvPath,
    key: panelPasswordName(countryCode),
    value: panelPassword,
  });

  await upsertEnvLine({
    filePath: serverEnvPath,
    key: nodeKeyName(countryCode),
    value: apiToken,
  });
};

export const provisionHost = async ({
  config,
  options: opts,
}: ProvisionHostInput): Promise<ProvisionResult> => {
  const ssh = (opts.createSshClient ?? (() => new SshClient()))();
  const outcome = { host: config.host, country: config.country };

  try {
    await ssh.connect({
      host: config.host,
      username: config.sshUser,
      password: config.sshPassword,
    });

    const { password } = await resolveNodeCredentials({
      envFilePath: opts.serverEnvPath,
      countryCode: config.countryCode,
    });

    const keys = generateRealityKeys();
    const shortId = generateShortId();

    await ensureDocker(ssh);
    await openTunnelPort(ssh);
    await shipStack({ ssh, composeContent: opts.xrayComposeContent });

    const token = await configurePanel({ ssh, password });
    const apiUrl = panelUrl(config.host);

    try {
      await pWaitFor(() => opts.healthCheck({ baseUrl: apiUrl, token }), {
        timeout: opts.healthCheckTimeoutMs ?? HEALTH_TIMEOUT_MS,
        interval: opts.healthCheckIntervalMs ?? HEALTH_INTERVAL_MS,
      });
    } catch {
      return { ...outcome, status: 'failed', error: 'the panel never answered the api' };
    }

    await opts.ensureInbound({
      baseUrl: apiUrl,
      token,
      inbound: buildRealityInbound({
        privateKey: keys.privateKey,
        shortId,
        donorHost: config.realityServerName,
      }),
    });

    await rememberNodeSecrets({
      serverEnvPath: opts.serverEnvPath,
      countryCode: config.countryCode,
      apiToken: token,
      panelPassword: password,
    });

    const { wasExisting } = await opts.upsertNode({
      prisma: opts.basePrisma,
      input: {
        country: config.country,
        countryCode: config.countryCode,
        city: config.city,
        host: config.host,
        port: LISTEN_PORT,
        realityServerName: config.realityServerName,
        realityPublicKey: keys.publicKey,
        realityShortId: shortId,
        apiUrl,
        apiTokenEnvVar: nodeKeyName(config.countryCode),
      },
    });

    return { ...outcome, status: wasExisting ? 'updated' : 'provisioned' };
  } catch (error) {
    return {
      ...outcome,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    ssh.dispose();
  }
};
