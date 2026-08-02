import type { XrayInbound } from '../../xray.types';
import type { XrayInboundSettings, XrayWireguardSettings } from './current-clients.types';

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

export const parseSettings = (inbound: XrayInbound): XrayInboundSettings => parseJson<XrayInboundSettings>(inbound.settings);

export const parseStreamSettings = (inbound: XrayInbound): Record<string, unknown> => parseJson<Record<string, unknown>>(inbound.streamSettings);

export const parseSniffing = (inbound: XrayInbound): Record<string, unknown> => parseJson<Record<string, unknown>>(inbound.sniffing);

export const currentClients = (inbound: XrayInbound): unknown[] => parseSettings(inbound).clients ?? [];

export const parseWireguardSettings = (inbound: XrayInbound): XrayWireguardSettings => parseJson<XrayWireguardSettings>(inbound.settings);
