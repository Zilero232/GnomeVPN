import { randomBytes } from 'node:crypto';
import { isNullish, isString } from 'remeda';

import type { XrayInbound, XrayInboundSettings } from './inbounds';
import type { PanelResourceUsage } from './panel-client';
import type { NodeTraffic } from './xray.types';

import { AUTH_BYTES, NO_TRAFFIC } from './xray.constants';

export const sumTraffic = (parts: NodeTraffic[]): NodeTraffic => {
  const add = (total: NodeTraffic, part: NodeTraffic): NodeTraffic => ({ up: total.up + part.up, down: total.down + part.down });

  return parts.reduce(add, NO_TRAFFIC);
};

export const generateAuth = (): string => randomBytes(AUTH_BYTES).toString('hex');

export const usageRatio = (usage: PanelResourceUsage | undefined): number | null => {
  if (isNullish(usage?.current) || isNullish(usage.total) || usage.total === 0) {
    return null;
  }

  return usage.current / usage.total;
};

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
