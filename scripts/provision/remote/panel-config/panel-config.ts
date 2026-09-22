import { arg, dockerExec, line } from '@gnomevpn/scripts/shell';
import pWaitFor from 'p-wait-for';

import type { ConfigurePanelInput, KeepCoreRunningInput, WaitForPanelInput } from './panel-config.types';

import { PANEL_USERNAME } from '../../../../apps/server/src/lib/xray';
import { log, PANEL_PORT } from '../../config';
import { CONTAINER_NAME } from '../xray-stack';
import { PANEL_BOOT_INTERVAL_MS, PANEL_BOOT_TIMEOUT_MS } from './panel-config.constants';

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

  log.done('the core no longer restarts when a client is disabled');
};

export const configurePanel = async ({ ssh, password, panelPath }: ConfigurePanelInput): Promise<string> => {
  log.step('configuring the panel credentials');

  await ssh.exec(
    dockerExec({
      container: CONTAINER_NAME,
      argv: ['/app/x-ui', 'setting', '-username', PANEL_USERNAME, '-password', arg(password), '-port', PANEL_PORT, '-webBasePath', arg(panelPath)]
    })
  );

  log.step('restarting the panel and waiting for it to listen');

  await ssh.exec(line(['docker', 'restart', CONTAINER_NAME]));
  await waitForPanel({ ssh, panelPath });

  const result = await ssh.exec(dockerExec({ container: CONTAINER_NAME, argv: ['/app/x-ui', 'setting', '-getApiToken'] }));

  const token = /apiToken:\s*(\S+)/.exec(result.stdout)?.[1];

  if (!token) {
    throw new Error(`could not read an api token from the panel: ${result.stdout.trim()}`);
  }

  log.done('the panel answered with an api token');

  await keepCoreRunning({ ssh, panelPath, token });

  return token;
};
