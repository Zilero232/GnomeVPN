import type { EnsureInboundInput, EnsureWireguardInboundInput, PanelCredentials } from './xray-panel.types';

import { XrayClient } from '../../../apps/server/src/lib/xray';

export const isPanelReachable = async (credentials: PanelCredentials): Promise<boolean> => new XrayClient(credentials).isReachable();

export const ensureInbound = async ({ inbound, ...credentials }: EnsureInboundInput) => {
  const xray = new XrayClient(credentials);

  if (await xray.hasInbound()) {
    await xray.updateInbound(inbound);
  } else {
    await xray.createInbound(inbound);
  }

  await xray.restartCore();
};

export const ensureWireguardInbound = async ({ inbound, ...credentials }: EnsureWireguardInboundInput) => {
  const xray = new XrayClient(credentials);

  await xray.ensureWireguardInbound(inbound);
  await xray.restartCore();
};
