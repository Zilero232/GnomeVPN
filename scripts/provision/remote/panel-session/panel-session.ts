import pWaitFor from 'p-wait-for';

import type { PanelSession, PanelUrlInput, StartPanelInput, WaitForPanelInput } from './panel-session.types';

import { PANEL_PORT } from '../../config';
import { configurePanel } from '../remote-setup';
import { isPanelReachable } from '../xray-panel';
import { HEALTH_INTERVAL_MS, HEALTH_TIMEOUT_MS } from './panel-session.constants';

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

export const startPanel = async ({ ssh, host, password, panelPath }: StartPanelInput): Promise<PanelSession> => {
  const token = await configurePanel({ ssh, password, panelPath });
  const baseUrl = panelUrl({ host, panelPath });

  if (!(await waitForPanel({ baseUrl, token }))) {
    throw new Error('the panel never answered the api');
  }

  return { baseUrl, token };
};
