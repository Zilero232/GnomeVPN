import { isTauri } from '@tauri-apps/api/core';
import { type as osType } from '@tauri-apps/plugin-os';

const isMobileUserAgent = (): boolean => /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export const isTauriMobile = (): boolean => {
  if (typeof window === 'undefined' || !isTauri()) {
    return false;
  }

  try {
    const type = osType();

    return type === 'android' || type === 'ios';
  } catch {
    return isMobileUserAgent();
  }
};

export const isTauriDesktop = (): boolean =>
  typeof window !== 'undefined' && isTauri() && !isTauriMobile();
