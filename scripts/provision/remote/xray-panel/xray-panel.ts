import type { EnsureInboundInput, PanelCredentials } from './xray-panel.types';

import { XrayClient } from '../../../../apps/server/src/lib/xray';
import { log } from '../../config';

export const isPanelReachable = async (credentials: PanelCredentials): Promise<boolean> => new XrayClient(credentials).isReachable();

export const ensureInbound = async ({ inbound, ...credentials }: EnsureInboundInput) => {
  const xray = new XrayClient(credentials);

  const exists = await xray.hasInbound();

  if (exists) {
    await xray.updateInbound(inbound);
  } else {
    await xray.createInbound(inbound);
  }

  await xray.restartCore();

  log.done(`the hysteria2 inbound was ${exists ? 'updated' : 'created'}`);
};

export const ensureVlessInbound = async ({ inbound, ...credentials }: EnsureInboundInput) => {
  const xray = new XrayClient(credentials);

  await xray.ensureVlessInbound(inbound);
  await xray.restartCore();

  log.done('the vless + reality inbound is in place');
};
