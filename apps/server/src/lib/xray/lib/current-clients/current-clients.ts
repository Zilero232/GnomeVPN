import type { XrayInbound } from '../../xray.types';
import type { XrayInboundSettings } from './current-clients.types';

const parseSettings = (settings: XrayInbound['settings']): XrayInboundSettings => {
  if (typeof settings !== 'string') {
    return (settings ?? {}) as XrayInboundSettings;
  }

  try {
    return JSON.parse(settings) as XrayInboundSettings;
  } catch {
    return {};
  }
};

export const currentClients = (inbound: XrayInbound): unknown[] =>
  parseSettings(inbound.settings).clients ?? [];
