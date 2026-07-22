import pWaitFor from 'p-wait-for';
import { quote } from 'shell-quote';

import { PANEL_USERNAME } from '../../../src/lib/xray';
import { LISTEN_PORT, PANEL_PORT } from '../reality-inbound';
import {
  CONTAINER_NAME,
  DOCKER_INSTALL_URL,
  PANEL_BOOT_INTERVAL_MS,
  PANEL_BOOT_TIMEOUT_MS,
  REMOTE_DIR,
} from './remote-setup.constants';

import type { SshClient } from '../ssh-client';
import type { ConfigurePanelInput, ShipStackInput, WaitForPanelInput } from './remote-setup.types';

export const ensureDocker = async (ssh: SshClient): Promise<void> => {
  const installed = await ssh.exec('docker --version');

  if (installed.exitCode !== 0) {
    await ssh.exec(`curl -fsSL ${DOCKER_INSTALL_URL} | sh`);
  }
};

export const shipStack = async ({ ssh, composeContent }: ShipStackInput): Promise<void> => {
  await ssh.exec(`mkdir -p ${REMOTE_DIR}`);
  await ssh.putFile(composeContent, `${REMOTE_DIR}/docker-compose.yml`);
  await ssh.exec(`cd ${REMOTE_DIR} && docker compose up -d`);
};

export const openTunnelPort = async (ssh: SshClient): Promise<void> => {
  const hasUfw = await ssh.exec('command -v ufw');

  if (hasUfw.exitCode !== 0) {
    return;
  }

  await ssh.exec(`ufw allow ${LISTEN_PORT}/tcp`);
  await ssh.exec(`ufw allow ${PANEL_PORT}/tcp`);
};

const waitForPanel = async ({ ssh, panelPath }: WaitForPanelInput): Promise<void> => {
  const isUp = async (): Promise<boolean> => {
    try {
      const result = await ssh.exec(
        `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${PANEL_PORT}/${panelPath}/`,
      );

      return result.stdout.trim() === '200';
    } catch {
      return false;
    }
  };

  try {
    await pWaitFor(isUp, {
      timeout: PANEL_BOOT_TIMEOUT_MS,
      interval: PANEL_BOOT_INTERVAL_MS,
    });
  } catch {
    throw new Error('the panel did not start listening after a restart');
  }
};

export const configurePanel = async ({
  ssh,
  password,
  panelPath,
}: ConfigurePanelInput): Promise<string> => {
  await ssh.exec(
    `docker exec ${CONTAINER_NAME} /app/x-ui setting -username ${PANEL_USERNAME} -password ${quote([password])} -port ${PANEL_PORT} -webBasePath ${panelPath}`,
  );

  await ssh.exec(`docker restart ${CONTAINER_NAME}`);
  await waitForPanel({ ssh, panelPath });

  const result = await ssh.exec(`docker exec ${CONTAINER_NAME} /app/x-ui setting -getApiToken`);

  const token = /apiToken:\s*(\S+)/.exec(result.stdout)?.[1];

  if (!token) {
    throw new Error(`could not read an api token from the panel: ${result.stdout.trim()}`);
  }

  return token;
};
