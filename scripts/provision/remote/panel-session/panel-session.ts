import pWaitFor from 'p-wait-for';

import type { PanelSession, PanelUrlInput, StartPanelInput, WaitForPanelInput } from './panel-session.types';

import { log, PORTS } from '../../config';
import { configurePanel } from '../panel-config';
import { isPanelReachable } from '../xray-panel';
import { PANEL_HEALTH } from './panel-session.constants';

const panelUrl = ({ host, panelPath }: PanelUrlInput) => `http://${host}:${PORTS.panel}/${panelPath}`;

const waitForPanel = async (credentials: WaitForPanelInput): Promise<boolean> => {
  try {
    await pWaitFor(() => isPanelReachable(credentials), {
      timeout: PANEL_HEALTH.timeoutMs,
      interval: PANEL_HEALTH.intervalMs
    });

    return true;
  } catch {
    return false;
  }
};

export const startPanel = async ({ ssh, host, password, panelPath }: StartPanelInput): Promise<PanelSession> => {
  const token = await configurePanel({ ssh, password, panelPath });
  const baseUrl = panelUrl({ host, panelPath });

  log.step('waiting for the panel api');

  if (!(await waitForPanel({ baseUrl, token }))) {
    throw new Error('the panel never answered the api');
  }

  log.done('the panel api is reachable');

  return { baseUrl, token };
};
