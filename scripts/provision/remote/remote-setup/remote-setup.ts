import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, dockerExec, dockerShell, line, orElse, silent } from '@gnomevpn/scripts/shell';
import pWaitFor from 'p-wait-for';

import type { ConfigurePanelInput, EnsuredRealityKeys, KeepCoreRunningInput, ShipStackInput, WaitForPanelInput } from './remote-setup.types';

import { PANEL_USERNAME } from '../../../../apps/server/src/lib/xray';
import { generateRealityKeys, generateRealityShortId } from '../../../../apps/server/src/modules/peers/lib/reality-keys';
import {
  CERT_PATH,
  KEY_PATH,
  LISTEN_PORT,
  MASQUERADE_HOST,
  PANEL_PORT,
  REALITY_KEY_PATH,
  REALITY_LISTEN_PORT,
  REALITY_PUB_PATH,
  REALITY_SID_PATH
} from '../../config';
import { CONTAINER_NAME, DOCKER_INSTALL_URL, PANEL_BOOT_INTERVAL_MS, PANEL_BOOT_TIMEOUT_MS, REMOTE_DIR } from './remote-setup.constants';

const inContainer = (script: string) => dockerShell({ container: CONTAINER_NAME, script });

export const ensureDocker = async (ssh: SshClient) => {
  const installed = await ssh.exec('docker --version');

  if (installed.exitCode !== 0) {
    await ssh.exec(`curl -fsSL ${DOCKER_INSTALL_URL} | sh`);
  }
};

export const ensureJq = async (ssh: SshClient) => {
  const installed = await ssh.exec('command -v jq');

  if (installed.exitCode !== 0) {
    await ssh.exec('apt-get update -qq && apt-get install -y -qq jq');
  }
};

export const shipStack = async ({ ssh, composeContent }: ShipStackInput) => {
  await ssh.exec(line(['mkdir', '-p', REMOTE_DIR]));
  await ssh.putFile(composeContent, `${REMOTE_DIR}/docker-compose.yml`);
  await ssh.exec(all([line(['cd', REMOTE_DIR]), 'docker compose up -d']));
};

export const ensureCert = async (ssh: SshClient) => {
  const generate = line([
    'openssl req -x509 -nodes -newkey ec',
    '-pkeyopt ec_paramgen_curve:prime256v1',
    `-keyout ${KEY_PATH}`,
    `-out ${CERT_PATH}`,
    `-subj ${arg(`/CN=${MASQUERADE_HOST}`)}`,
    '-days 3650'
  ]);

  await ssh.exec(inContainer(all([line(['mkdir', '-p', dirOf(CERT_PATH)]), `(${orElse([`test -f ${CERT_PATH}`, generate])})`])));
};

export const readCertFingerprint = async (ssh: SshClient): Promise<string> => {
  const result = await ssh.exec(inContainer(line([`openssl x509 -in ${CERT_PATH}`, '-noout -fingerprint -sha256'])));

  if (result.exitCode !== 0) {
    throw new Error(`cannot read the node certificate fingerprint: ${result.stderr.trim() || 'no output'}`);
  }

  const fingerprint = result.stdout.trim().split('=')[1];

  if (!fingerprint) {
    throw new Error('the node returned no certificate fingerprint');
  }

  return fingerprint;
};

export const openTunnelPort = async (ssh: SshClient) => {
  const hasUfw = await ssh.exec('command -v ufw');

  if (hasUfw.exitCode !== 0) {
    return;
  }

  const rules = [`${LISTEN_PORT}/udp`, `${REALITY_LISTEN_PORT}/tcp`, `${PANEL_PORT}/tcp`];

  for (const rule of rules) {
    await ssh.exec(line(['ufw', 'allow', rule]));
  }
};

export const ensureRealityKeys = async (ssh: SshClient): Promise<EnsuredRealityKeys> => {
  const fresh = generateRealityKeys();
  const freshShortId = generateRealityShortId();

  const seed = [
    [REALITY_KEY_PATH, fresh.privateKey],
    [REALITY_PUB_PATH, fresh.publicKey],
    [REALITY_SID_PATH, freshShortId]
  ] as const;

  const result = await ssh.exec(
    inContainer(
      all([
        line(['mkdir', '-p', dirOf(REALITY_KEY_PATH)]),
        ...seed.map(([path, value]) => orElse([silent(line(['test', '-s', path])), `printf '%s\\\\n' ${arg(value)} > ${path}`])),
        ...seed.map(([path]) => line(['awk', arg('NR==1{print; exit}'), path]))
      ])
    )
  );

  if (result.exitCode !== 0) {
    throw new Error(`cannot reach the panel container to read the Reality keys: ${result.stderr.trim() || 'no output'}`);
  }

  const [privateKey, publicKey, shortId] = result.stdout
    .trim()
    .split('\n')
    .map((value) => value.trim());

  if (!privateKey || !publicKey || !shortId) {
    throw new Error('the panel container returned no Reality keys');
  }

  return { privateKey, publicKey, shortId, wasGenerated: privateKey === fresh.privateKey };
};

const waitForPanel = async ({ ssh, panelPath }: WaitForPanelInput) => {
  const probe = line(['curl -s -o /dev/null', "-w '%{http_code}'", `http://127.0.0.1:${PANEL_PORT}/${panelPath}/`]);

  const isUp = async (): Promise<boolean> => {
    try {
      const result = await ssh.exec(probe);

      return result.stdout.trim() === '200';
    } catch {
      return false;
    }
  };

  try {
    await pWaitFor(isUp, { timeout: PANEL_BOOT_TIMEOUT_MS, interval: PANEL_BOOT_INTERVAL_MS });
  } catch {
    throw new Error('the panel did not start listening after a restart');
  }
};

const keepCoreRunning = async ({ ssh, panelPath, token }: KeepCoreRunningInput): Promise<void> => {
  const api = `http://127.0.0.1:${PANEL_PORT}/${panelPath}/panel/api/setting`;
  const auth = `Authorization: Bearer ${token}`;

  const result = await ssh.exec(
    line([
      `curl -s -X POST -H ${arg(auth)} ${arg(`${api}/all`)}`,
      `| jq -c ${arg('.obj + {restartXrayOnClientDisable: false}')}`,
      `| curl -s -o /dev/null -w "%{http_code}" -X POST -H ${arg(auth)} -H "Content-Type: application/json" --data-binary @- ${arg(`${api}/update`)}`
    ])
  );

  if (result.stdout.trim() !== '200') {
    throw new Error(`could not turn off the core restart on client disable: ${result.stdout.trim() || result.stderr.trim()}`);
  }
};

export const configurePanel = async ({ ssh, password, panelPath }: ConfigurePanelInput): Promise<string> => {
  await ssh.exec(
    dockerExec({
      container: CONTAINER_NAME,
      argv: ['/app/x-ui', 'setting', '-username', PANEL_USERNAME, '-password', arg(password), '-port', PANEL_PORT, '-webBasePath', arg(panelPath)]
    })
  );

  await ssh.exec(line(['docker', 'restart', CONTAINER_NAME]));
  await waitForPanel({ ssh, panelPath });

  const result = await ssh.exec(dockerExec({ container: CONTAINER_NAME, argv: ['/app/x-ui', 'setting', '-getApiToken'] }));

  const token = /apiToken:\s*(\S+)/.exec(result.stdout)?.[1];

  if (!token) {
    throw new Error(`could not read an api token from the panel: ${result.stdout.trim()}`);
  }

  await keepCoreRunning({ ssh, panelPath, token });

  return token;
};
