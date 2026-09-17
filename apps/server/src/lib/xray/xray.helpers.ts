import { randomBytes } from 'node:crypto';
import { isNullish, isString } from 'remeda';

import type { XrayInbound, XrayInboundSettings } from './inbounds';

import { AUTH_BYTES } from './xray.constants';

export const generateAuth = (): string => randomBytes(AUTH_BYTES).toString('hex');

export const readSettings = <T>(inbound: XrayInbound): T | null => {
  if (!isString(inbound.settings)) {
    return (inbound.settings as T | undefined) ?? null;
  }

  try {
    return JSON.parse(inbound.settings) as T;
  } catch {
    return null;
  }
};

export const readClients = (inbound: XrayInbound): unknown[] | null => {
  if (!isString(inbound.settings)) {
    return isNullish(inbound.settings?.clients) ? null : (inbound.settings.clients as unknown[]);
  }

  try {
    const parsed = JSON.parse(inbound.settings) as XrayInboundSettings;

    return parsed.clients ?? [];
  } catch {
    return null;
  }
};
