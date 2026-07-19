import { invoke, isTauri } from '@tauri-apps/api/core';
import { createAuthClient } from 'better-auth/react';

import { env } from '@/shared/config';

const STORAGE_KEY = 'gnomevpn.auth-token';

const mirrorToVault = (command: string, args?: Record<string, unknown>) => {
  if (!isTauri()) {
    return;
  }

  invoke(command, args).catch(() => {});
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? '';
};

export const saveAuthToken = (token: string | null) => {
  if (typeof window === 'undefined' || !token) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, token);
  mirrorToVault('vault_save_token', { token });
};

export const clearToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  mirrorToVault('vault_clear_token');
};

export const restoreTokenFromVault = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !isTauri()) {
    return false;
  }

  if (window.localStorage.getItem(STORAGE_KEY)) {
    return true;
  }

  try {
    const token = await invoke<string | null>('vault_read_token');

    if (!token) {
      return false;
    }

    window.localStorage.setItem(STORAGE_KEY, token);

    return true;
  } catch {
    return false;
  }
};

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath: '/auth',
  fetchOptions: {
    auth: { type: 'Bearer', token: getAuthToken },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      saveAuthToken(token);
    },
  },
});
