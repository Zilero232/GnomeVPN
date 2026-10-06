import { isString } from 'remeda';

import type { CleanedInput, DeviceHeaders, HeaderOfInput } from './device-identity.types';

import { DEVICE_FIELD, DEVICE_HEADER, DEVICE_KEY } from '../../config';

export const headerOf = ({ headers, name }: HeaderOfInput): string | null => {
  const value = headers[name];
  const first = Array.isArray(value) ? value[0] : value;

  return isString(first) ? first : null;
};

export const cleaned = ({ value, maxLength = DEVICE_FIELD.maxLength }: CleanedInput): string | null => {
  const printable = value?.replaceAll(/\p{C}/gu, '').trim();

  return printable ? printable.slice(0, maxLength) : null;
};

export const hwidOf = (headers: DeviceHeaders): string | null => {
  const raw = cleaned({ value: headerOf({ headers, name: DEVICE_HEADER.hwid }) ?? headerOf({ headers, name: DEVICE_HEADER.androidId }) });

  return raw && DEVICE_FIELD.hwid.test(raw) ? raw.toUpperCase() : null;
};

export const appOf = (userAgent: string | null): string | null => {
  if (!userAgent) {
    return null;
  }

  if (DEVICE_FIELD.incyAgent.test(userAgent)) {
    return DEVICE_KEY.incyApp;
  }

  return cleaned({ value: DEVICE_FIELD.agentName.exec(userAgent.trim())?.[1] ?? null, maxLength: DEVICE_FIELD.appMaxLength });
};

export const agentPlatformOf = (userAgent: string | null): string | null =>
  cleaned({ value: DEVICE_FIELD.incyAgent.exec(userAgent ?? '')?.[1] ?? null });
