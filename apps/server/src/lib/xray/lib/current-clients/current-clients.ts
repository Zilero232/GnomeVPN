import type { XrayInbound } from '../../xray.types';
import type { XrayInboundSettings } from './current-clients.types';

const parseJson = <T>(value: string | Record<string, unknown> | undefined): T => {
  if (typeof value !== 'string') {
    return (value ?? {}) as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
};

export const parseSettings = (inbound: XrayInbound): XrayInboundSettings =>
  parseJson<XrayInboundSettings>(inbound.settings);

export const parseStreamSettings = (inbound: XrayInbound): Record<string, unknown> =>
  parseJson<Record<string, unknown>>(inbound.streamSettings);

export const currentClients = (inbound: XrayInbound): unknown[] =>
  parseSettings(inbound).clients ?? [];
