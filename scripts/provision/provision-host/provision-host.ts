import { SshClient } from '@gnomevpn/scripts/ssh';
import pWaitFor from 'p-wait-for';

import type {
  InstalledInbounds,
  InstallInboundsInput,
  PanelUrlInput,
  PrepareHostInput,
  ProvisionHostInput,
  ProvisionResult,
  RegisterNodeInput,
  RememberNodeSecretsInput,
  StartPanelInput,
  WaitForPanelInput
} from './provision-host.types';

import { generateAuth } from '../../../apps/server/src/lib/xray';
import { WG } from '../../../apps/server/src/modules/peers/config';
import { upsertEnvGroup } from '../env-file';
import { buildHysteriaInbound, LISTEN_PORT, MASQUERADE_HOST, PANEL_PORT } from '../hysteria-inbound';
import { nodeKeyName, panelPasswordName, panelPathName, resolveNodeCredentials } from '../node-credentials';
import { configurePanel, ensureCert, ensureDocker, ensureWireguardKeys, openTunnelPort, shipStack } from '../remote-setup';
import { upsertNode } from '../upsert-node';
import { buildWireguardInbound } from '../wireguard-inbound';
import { ensureInbound, ensureWireguardInbound, isPanelReachable } from '../xray-panel';
import { HEALTH_INTERVAL_MS, HEALTH_TIMEOUT_MS } from './provision-host.constants';

const panelUrl = ({ host, panelPath }: PanelUrlInput) => `http://${host}:${PANEL_PORT}/${panelPath}`;

const waitForPanel = async (credentials: WaitForPanelInput): Promise<boolean> => {
  try {
    await pWaitFor(() => isPanelReachable(credentials), {
      timeout: HEALTH_TIMEOUT_MS,
      interval: HEALTH_INTERVAL_MS
    });

    return true;
  } catch {
    return false;
  }
};

const prepareHost = async ({ ssh, xrayComposeContent }: PrepareHostInput) => {
  await ensureDocker(ssh);
  await openTunnelPort(ssh);
  await shipStack({ ssh, composeContent: xrayComposeContent });
};

const startPanel = async ({ ssh, host, password, panelPath }: StartPanelInput) => {
  const token = await configurePanel({ ssh, password, panelPath });
  const baseUrl = panelUrl({ host, panelPath });

  if (!(await waitForPanel({ baseUrl, token }))) {
    throw new Error('the panel never answered the api');
  }

  return { baseUrl, token };
};

const installInbounds = async ({ ssh, panel, auth }: InstallInboundsInput): Promise<InstalledInbounds> => {
  await ensureCert(ssh);

  await ensureInbound({
    ...panel,
    inbound: buildHysteriaInbound({ auth, sni: MASQUERADE_HOST })
  });

  const keys = await ensureWireguardKeys(ssh);

  await ensureWireguardInbound({
    ...panel,
    inbound: buildWireguardInbound({
      secretKey: keys.privateKey,
      listenPort: WG.listenPort,
      mtu: WG.mtu
    })
  });

  return { wgPublicKey: keys.publicKey, wgWasGenerated: keys.wasGenerated };
};

const rememberNodeSecrets = async ({ serverEnvPath, countryCode, apiToken, panelPassword, panelPath }: RememberNodeSecretsInput) =>
  upsertEnvGroup({
    filePath: serverEnvPath,
    entries: [
      { key: panelPathName(countryCode), value: panelPath },
      { key: panelPasswordName(countryCode), value: panelPassword },
      { key: nodeKeyName(countryCode), value: apiToken }
    ]
  });

const registerNode = async ({
  config,
  prisma,
  serverEnvPath,
  panel,
  password,
  panelPath,
  auth,
  wgPublicKey
}: RegisterNodeInput): Promise<boolean> => {
  await rememberNodeSecrets({
    serverEnvPath,
    countryCode: config.countryCode,
    apiToken: panel.token,
    panelPassword: password,
    panelPath
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
      hysteriaAuth: auth,
      wgPublicKey,
      apiUrl: panel.baseUrl,
      apiTokenEnvVar: nodeKeyName(config.countryCode)
    }
  });

  return wasExisting;
};

export const provisionHost = async ({ config, prisma, serverEnvPath, xrayComposeContent }: ProvisionHostInput): Promise<ProvisionResult> => {
  const ssh = new SshClient();
  const outcome = { host: config.host, country: config.country };

  try {
    await ssh.connect({
      host: config.host,
      username: config.sshUser,
      password: config.sshPassword
    });

    const { password, panelPath } = await resolveNodeCredentials({
      envFilePath: serverEnvPath,
      countryCode: config.countryCode
    });

    const auth = generateAuth();

    await prepareHost({ ssh, xrayComposeContent });

    const panel = await startPanel({ ssh, host: config.host, password, panelPath });
    const { wgPublicKey, wgWasGenerated } = await installInbounds({ ssh, panel, auth });

    const wasExisting = await registerNode({
      config,
      prisma,
      serverEnvPath,
      panel,
      password,
      panelPath,
      auth,
      wgPublicKey
    });

    const lostWireguardKeys = wasExisting && wgWasGenerated;

    return {
      ...outcome,
      status: wasExisting ? 'updated' : 'provisioned',
      ...(lostWireguardKeys && { lostWireguardKeys })
    };
  } catch (error) {
    return {
      ...outcome,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    ssh.dispose();
  }
};
