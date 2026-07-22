import pWaitFor from 'p-wait-for';

import { upsertEnvLine } from '../env-file';
import { nodeKeyName, panelPasswordName, resolveNodeCredentials } from '../node-credentials';
import {
  buildRealityInbound,
  DONOR_HOST,
  LISTEN_PORT,
  PANEL_PATH,
  PANEL_PORT,
} from '../reality-inbound';
import { generateRealityKeys, generateShortId } from '../reality-keys';
import { configurePanel, ensureDocker, openTunnelPort, shipStack } from '../remote-setup';
import { SshClient } from '../ssh-client';
import { upsertNode } from '../upsert-node';
import { ensureInbound, isPanelReachable } from '../xray-panel';
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

const waitForPanel = async (credentials: { baseUrl: string; token: string }): Promise<boolean> => {
  try {
    await pWaitFor(() => isPanelReachable(credentials), {
      timeout: HEALTH_TIMEOUT_MS,
      interval: HEALTH_INTERVAL_MS,
    });

    return true;
  } catch {
    return false;
  }
};

export const provisionHost = async ({
  config,
  prisma,
  serverEnvPath,
  xrayComposeContent,
}: ProvisionHostInput): Promise<ProvisionResult> => {
  const ssh = new SshClient();
  const outcome = { host: config.host, country: config.country };

  try {
    await ssh.connect({
      host: config.host,
      username: config.sshUser,
      password: config.sshPassword,
    });

    const { password } = await resolveNodeCredentials({
      envFilePath: serverEnvPath,
      countryCode: config.countryCode,
    });

    const keys = generateRealityKeys();
    const shortId = generateShortId();

    await ensureDocker(ssh);
    await openTunnelPort(ssh);
    await shipStack({ ssh, composeContent: xrayComposeContent });

    const token = await configurePanel({ ssh, password });
    const baseUrl = panelUrl(config.host);

    if (!(await waitForPanel({ baseUrl, token }))) {
      return { ...outcome, status: 'failed', error: 'the panel never answered the api' };
    }

    await ensureInbound({
      baseUrl,
      token,
      inbound: buildRealityInbound({ privateKey: keys.privateKey, shortId }),
    });

    await rememberNodeSecrets({
      serverEnvPath,
      countryCode: config.countryCode,
      apiToken: token,
      panelPassword: password,
    });

    const { wasExisting } = await upsertNode({
      prisma,
      input: {
        country: config.country,
        countryCode: config.countryCode,
        city: config.city,
        host: config.host,
        port: LISTEN_PORT,
        realityServerName: DONOR_HOST,
        realityPublicKey: keys.publicKey,
        realityShortId: shortId,
        apiUrl: baseUrl,
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
