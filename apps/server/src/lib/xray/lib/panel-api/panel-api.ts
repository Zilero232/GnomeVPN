import ThreeXUI from '3xui-api-client';

import type { PanelApiInput, PanelInterceptors } from './panel-api.types';

// 3xui-api-client attaches `data: {}` to every GET. The panel's Go server then
// waits for a body that never arrives and the request hangs until the timeout,
// so every GET in the library — inbounds, clients, traffic — is unusable
// without this. Stripping the body restores the ~50ms responses the panel
// gives curl.
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
