import { deviceIdSetting } from '../app-settings';
import { isServer } from '../env';

const STORAGE_KEY = 'gnomevpn.device-id';

let pending: Promise<string> | null = null;

const fromBrowserStorage = (): string => {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return stored;
  }

  const created = crypto.randomUUID();

  window.localStorage.setItem(STORAGE_KEY, created);

  return created;
};

const resolveDeviceId = async (): Promise<string> => {
  const stored = await deviceIdSetting.get();

  if (stored) {
    return stored;
  }

  const created = isServer() ? crypto.randomUUID() : fromBrowserStorage();

  await deviceIdSetting.set(created);

  return created;
};

export const getDeviceId = async (): Promise<string> => {
  pending ??= resolveDeviceId().finally(() => {
    pending = null;
  });

  return pending;
};
