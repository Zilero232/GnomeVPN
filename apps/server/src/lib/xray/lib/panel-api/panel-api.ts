import ThreeXUI from '3xui-api-client';

import type { PanelApiInput, PanelInterceptors } from './panel-api.types';

export const panelApi = ({ baseUrl, token, timeout }: PanelApiInput): ThreeXUI => {
  const panel = new ThreeXUI(baseUrl, { token, timeout });

  const { api } = panel as unknown as { api: PanelInterceptors };

  api.interceptors.request.use((config) => {
    if (String(config.method ?? '').toLowerCase() === 'get') {
      config.data = undefined;
    }

    return config;
  });

  return panel;
};
