import { arg, dockerExec, line } from '@gnomevpn/scripts/shell';
import pWaitFor from 'p-wait-for';

import type { ConfigurePanelInput, KeepCoreRunningInput, WaitForPanelInput } from './panel-config.types';

import { PANEL_USERNAME } from '../../../../apps/server/src/lib/xray';
import { log, PORTS } from '../../config';
import { CONTAINER_NAME } from '../xray-stack';
import { PANEL_BOOT } from './panel-config.constants';
import { assertPanelAccepted, settingsKeepingCore } from './panel-config.helpers';

const waitForPanel = async ({ ssh, panelPath }: WaitForPanelInput) => {
  const probe = line(['curl -s -o /dev/null', "-w '%{http_code}'", arg(`http://127.0.0.1:${PORTS.panel}/${panelPath}/`)]);

  const isUp = async (): Promise<boolean> => {
    try {
      const result = await ssh.exec(probe);

      return result.stdout.trim() === '200';
    } catch {
      return false;
    }
  };

  try {
    await pWaitFor(isUp, { timeout: PANEL_BOOT.timeoutMs, interval: PANEL_BOOT.intervalMs });
  } catch {
    throw new Error('the panel did not start listening after a restart');
  }
};

const keepCoreRunning = async ({ ssh, panelPath, token }: KeepCoreRunningInput): Promise<void> => {
  const api = `http://127.0.0.1:${PORTS.panel}/${panelPath}/panel/api/setting`;
  const auth = arg(`Authorization: Bearer ${token}`);

  const current = await ssh.run(line(['curl -sf -X POST -H', auth, arg(`${api}/all`)]));
  const body = settingsKeepingCore(current.stdout);

  const saved = await ssh.run(
    line([`printf '%s' ${arg(body)} |`, 'curl -sf -X POST -H', auth, "-H 'Content-Type: application/json' --data-binary @-", arg(`${api}/update`)])
  );

  assertPanelAccepted(saved.stdout);

  log.done('the core no longer restarts when a client is disabled');
};

export const configurePanel = async ({ ssh, password, panelPath }: ConfigurePanelInput): Promise<string> => {
  log.step('configuring the panel credentials');

  await ssh.run(
    dockerExec({
      container: CONTAINER_NAME,
      argv: [
        '/app/x-ui',
        'setting',
        '-username',
        arg(PANEL_USERNAME),
        '-password',
        arg(password),
        '-port',
        PORTS.panel,
        '-webBasePath',
        arg(panelPath)
      ]
    })
  );

  log.step('restarting the panel and waiting for it to listen');

  await ssh.run(line(['docker', 'restart', CONTAINER_NAME]));
  await waitForPanel({ ssh, panelPath });

  const result = await ssh.run(dockerExec({ container: CONTAINER_NAME, argv: ['/app/x-ui', 'setting', '-getApiToken'] }));

  const token = /apiToken:\s*(\S+)/.exec(result.stdout)?.[1];

  if (!token) {
    throw new Error('could not read an api token from the panel');
  }

  log.done('the panel answered with an api token');

  await keepCoreRunning({ ssh, panelPath, token });

  return token;
};
