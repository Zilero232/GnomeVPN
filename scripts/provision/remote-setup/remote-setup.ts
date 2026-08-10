import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, dockerExec, dockerShell, line, orElse, silent } from '@gnomevpn/scripts/shell';
import pWaitFor from 'p-wait-for';

import type { ConfigurePanelInput, EnsuredWireguardKeys, ShipStackInput, WaitForPanelInput } from './remote-setup.types';

import { PANEL_USERNAME } from '../../../apps/server/src/lib/xray';
import { WG } from '../../../apps/server/src/modules/peers/config';
import { generateWireguardKeys } from '../../../apps/server/src/modules/peers/lib/wg-keys';
import { CERT_PATH, HOP_PORT_FROM, HOP_PORT_TO, KEY_PATH, LISTEN_PORT, MASQUERADE_HOST, PANEL_PORT } from '../hysteria-inbound';
import { WG_KEY_PATH, WG_PUB_PATH } from '../wireguard-inbound';
import { CONTAINER_NAME, DOCKER_INSTALL_URL, PANEL_BOOT_INTERVAL_MS, PANEL_BOOT_TIMEOUT_MS, REMOTE_DIR } from './remote-setup.constants';

const inContainer = (script: string) => dockerShell({ container: CONTAINER_NAME, script });

export const ensureDocker = async (ssh: SshClient) => {
  const installed = await ssh.exec('docker --version');

  if (installed.exitCode !== 0) {
    await ssh.exec(`curl -fsSL ${DOCKER_INSTALL_URL} | sh`);
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

export const openTunnelPort = async (ssh: SshClient) => {
  const hasUfw = await ssh.exec('command -v ufw');

  if (hasUfw.exitCode !== 0) {
    return;
  }

  const rules = [`${LISTEN_PORT}/udp`, `${PANEL_PORT}/tcp`, `${WG.listenPort}/udp`, `${HOP_PORT_FROM}:${HOP_PORT_TO}/udp`];

  for (const rule of rules) {
    await ssh.exec(line(['ufw', 'allow', rule]));
  }
};

export const enablePortHopping = async (ssh: SshClient) => {
  const rule = line(['PREROUTING -p udp', `--dport ${HOP_PORT_FROM}:${HOP_PORT_TO}`, `-j REDIRECT --to-ports ${LISTEN_PORT}`]);

  await ssh.exec(orElse([silent(`iptables -t nat -C ${rule}`), `iptables -t nat -I ${rule}`]));

  await ssh.exec(orElse([all([silent('command -v netfilter-persistent'), 'netfilter-persistent save']), 'true']));
};

export const ensureWireguardKeys = async (ssh: SshClient): Promise<EnsuredWireguardKeys> => {
  const fresh = generateWireguardKeys();

  const result = await ssh.exec(
    inContainer(
      all([
        line(['mkdir', '-p', dirOf(WG_KEY_PATH)]),
        orElse([silent(line(['test', '-s', WG_KEY_PATH])), `printf "%s" ${arg(fresh.privateKey)} > ${WG_KEY_PATH}`]),
        orElse([silent(line(['test', '-s', WG_PUB_PATH])), `printf "%s" ${arg(fresh.publicKey)} > ${WG_PUB_PATH}`]),
        line(['cat', WG_KEY_PATH]),
        'echo',
        line(['cat', WG_PUB_PATH])
      ])
    )
  );

  if (result.exitCode !== 0) {
    throw new Error(`cannot reach the panel container to read the WireGuard keys: ${result.stderr.trim() || 'no output'}`);
  }

  const [privateKey, publicKey] = result.stdout.trim().split('\n');

  if (!privateKey || !publicKey) {
    throw new Error('the panel container returned no WireGuard keys');
  }

  return { privateKey, publicKey, wasGenerated: privateKey === fresh.privateKey };
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

  return token;
};
