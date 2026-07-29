import { isTauri } from '@tauri-apps/api/core';
import { type as osType } from '@tauri-apps/plugin-os';

import { isBrowser, isServer } from '../env';

const isMobileUserAgent = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export const isTauriMobile = (): boolean => {
  if (isServer() || !isTauri()) {
    return false;
  }

  try {
    const type = osType();

    return type === 'android' || type === 'ios';
  } catch {
    return isMobileUserAgent();
  }
};

export const isTauriDesktop = (): boolean => isBrowser() && isTauri() && !isTauriMobile();
