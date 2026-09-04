import { randomBytes } from 'node:crypto';

import type { XrayInbound, XrayInboundSettings } from './inbounds';
import type { XrayWireguardSettings } from './wireguard';

import { AUTH_BYTES } from './xray.constants';

export const generateAuth = (): string => randomBytes(AUTH_BYTES).toString('hex');

export const stripCidrMask = (address: string): string => address.replace(/\/\d+$/, '');

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

export const parseWireguardSettings = (inbound: XrayInbound): XrayWireguardSettings => parseJson<XrayWireguardSettings>(inbound.settings);

export const currentClients = (inbound: XrayInbound): unknown[] => parseSettings(inbound).clients ?? [];
