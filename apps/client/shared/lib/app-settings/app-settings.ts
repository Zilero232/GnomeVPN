import type { SplitConfig, TunnelProtocol } from '@gnomevpn/schemas';
import type { Store } from '@tauri-apps/plugin-store';

import { DEFAULT_TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { isTauri } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { load } from '@tauri-apps/plugin-store';

import { logger } from '../logger';
import { emptySplitConfig, normalizeSplitConfig } from '../vpn-bridge';

const STORE_FILE = 'settings.json';

const KEYS = {
  autoConnect: 'autoConnect',
  lastNodeId: 'lastNodeId',
  autoStartInitialized: 'autoStartInitialized',
  autoReconnect: 'autoReconnect',
  deviceId: 'deviceId',
  manuallyDisconnected: 'manuallyDisconnected',
  split: 'split',
  protocol: 'protocol'
} as const;

let storePromise: Promise<Store> | null = null;

const getStore = async () => {
  storePromise ??= load(STORE_FILE, { autoSave: true });

  return storePromise;
};

const read = async <T>(key: string, fallback: T): Promise<T> => {
  if (!isTauri()) {
    return fallback;
  }

  try {
    const store = await getStore();

    return (await store.get<T>(key)) ?? fallback;
  } catch (error) {
    logger.warn(`settings read failed for ${key}: ${String(error)}`);

    return fallback;
  }
};

const write = async (key: string, value: unknown) => {
  if (!isTauri()) {
    return;
  }

  try {
    const store = await getStore();
    await store.set(key, value);
  } catch (error) {
    logger.warn(`settings write failed for ${key}: ${String(error)}`);
  }
};

export const getAutoConnect = async (): Promise<boolean> => read(KEYS.autoConnect, true);

export const setAutoConnect = async (value: boolean): Promise<void> =>
  write(KEYS.autoConnect, value);

export const getDeviceId = async (): Promise<string | null> => read(KEYS.deviceId, null);

export const setDeviceId = async (value: string): Promise<void> => write(KEYS.deviceId, value);

export const getAutoReconnect = async (): Promise<boolean> => read(KEYS.autoReconnect, true);

export const setAutoReconnect = async (value: boolean): Promise<void> =>
  write(KEYS.autoReconnect, value);

export const getSplitConfig = async (): Promise<SplitConfig> =>
  normalizeSplitConfig(await read<unknown>(KEYS.split, emptySplitConfig()));

export const setSplitConfig = async (value: SplitConfig): Promise<void> => write(KEYS.split, value);

export const getProtocol = async (): Promise<TunnelProtocol> =>
  read(KEYS.protocol, DEFAULT_TUNNEL_PROTOCOL);

export const setProtocol = async (value: TunnelProtocol): Promise<void> =>
  write(KEYS.protocol, value);

export const wasManuallyDisconnected = async (): Promise<boolean> =>
  read(KEYS.manuallyDisconnected, false);

export const setManuallyDisconnected = async (value: boolean): Promise<void> =>
  write(KEYS.manuallyDisconnected, value);

export const getLastNodeId = async (): Promise<string | null> => read(KEYS.lastNodeId, null);

export const setLastNodeId = async (nodeId: string): Promise<void> =>
  write(KEYS.lastNodeId, nodeId);

export const isAutoStartEnabled = async (): Promise<boolean> => {
  if (!isTauri()) {
    return false;
  }

  try {
    return await isEnabled();
  } catch (error) {
    logger.warn(`autostart check failed: ${String(error)}`);

    return false;
  }
};

export const setAutoStart = async (value: boolean): Promise<void> => {
  if (!isTauri()) {
    return;
  }

  try {
    await (value ? enable() : disable());
  } catch (error) {
    logger.error(`autostart ${value ? 'enable' : 'disable'} failed: ${String(error)}`);
  }
};

export const initAutoStartDefault = async (): Promise<void> => {
  if (!isTauri()) {
    return;
  }

  if (await read(KEYS.autoStartInitialized, false)) {
    return;
  }

  await setAutoStart(true);
  await write(KEYS.autoStartInitialized, true);
};
