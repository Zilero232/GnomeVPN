import pWaitFor from 'p-wait-for';

import { upsertEnvGroup } from '../env-file';
import { generateAuth } from '../hysteria-auth';
import {
  buildHysteriaInbound,
  LISTEN_PORT,
  MASQUERADE_HOST,
  PANEL_PORT,
} from '../hysteria-inbound';
import {
  nodeKeyName,
  panelPasswordName,
  panelPathName,
  resolveNodeCredentials,
} from '../node-credentials';
import {
  configurePanel,
  ensureCert,
  ensureDocker,
  openTunnelPort,
  shipStack,
} from '../remote-setup';
import { SshClient } from '../ssh-client';
import { upsertNode } from '../upsert-node';
import { ensureInbound, isPanelReachable } from '../xray-panel';
import { HEALTH_INTERVAL_MS, HEALTH_TIMEOUT_MS } from './provision-host.constants';

import type {
  PanelUrlInput,
  ProvisionHostInput,
  ProvisionResult,
  RememberNodeSecretsInput,
  WaitForPanelInput,
} from './provision-host.types';

const panelUrl = ({ host, panelPath }: PanelUrlInput): string =>
  `http://${host}:${PANEL_PORT}/${panelPath}`;

const rememberNodeSecrets = async ({
  serverEnvPath,
  countryCode,
  apiToken,
  panelPassword,
  panelPath,
}: RememberNodeSecretsInput): Promise<void> =>
  upsertEnvGroup({
    filePath: serverEnvPath,
    entries: [
      { key: panelPathName(countryCode), value: panelPath },
      { key: panelPasswordName(countryCode), value: panelPassword },
      { key: nodeKeyName(countryCode), value: apiToken },
    ],
  });

const waitForPanel = async (credentials: WaitForPanelInput): Promise<boolean> => {
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

    const { password, panelPath } = await resolveNodeCredentials({
      envFilePath: serverEnvPath,
      countryCode: config.countryCode,
    });

    const auth = generateAuth();

    await ensureDocker(ssh);
    await openTunnelPort(ssh);
    await shipStack({ ssh, composeContent: xrayComposeContent });

    const token = await configurePanel({ ssh, password, panelPath });
    const baseUrl = panelUrl({ host: config.host, panelPath });

    if (!(await waitForPanel({ baseUrl, token }))) {
      return { ...outcome, status: 'failed', error: 'the panel never answered the api' };
    }

    await ensureCert(ssh);

    await ensureInbound({
      baseUrl,
      token,
      inbound: buildHysteriaInbound({ auth, sni: MASQUERADE_HOST }),
    });

    await rememberNodeSecrets({
      serverEnvPath,
      countryCode: config.countryCode,
      apiToken: token,
      panelPassword: password,
      panelPath,
    });

    const { wasExisting } = await upsertNode({
      prisma,
      input: {
        country: config.country,
        countryCode: config.countryCode,
        city: config.city,
        host: config.host,
        port: LISTEN_PORT,
        serverName: MASQUERADE_HOST,
        auth,
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
