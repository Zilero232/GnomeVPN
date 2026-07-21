import { isTauri } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { load, type Store } from '@tauri-apps/plugin-store';

import { logger } from '../logger';

const STORE_FILE = 'settings.json';

const KEYS = {
  autoConnect: 'autoConnect',
  lastNodeId: 'lastNodeId',
  autoStartInitialized: 'autoStartInitialized',
  autoReconnect: 'autoReconnect',
  deviceId: 'deviceId',
  manuallyDisconnected: 'manuallyDisconnected',
} as const;

let storePromise: Promise<Store> | null = null;

const getStore = async (): Promise<Store> => {
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

const write = async (key: string, value: unknown): Promise<void> => {
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
