import { getDeviceId as read, setDeviceId as write } from '../app-settings';

const STORAGE_KEY = 'gnomevpn.device-id';

const fromBrowserStorage = (): string => {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return stored;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);

  return created;
};

export const getDeviceId = async (): Promise<string> => {
  const stored = await read();

  if (stored) {
    return stored;
  }

  const created = typeof window === 'undefined' ? crypto.randomUUID() : fromBrowserStorage();

  await write(created);

  return created;
};
