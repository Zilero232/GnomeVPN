import { createAuthClient } from 'better-auth/react';

import { env } from '@/shared/config';
import { clearTokenFromVault, isServer, readTokenFromVault, saveTokenToVault } from '@/shared/lib';

const STORAGE_KEY = 'gnomevpn.auth-token';

export const getAuthToken = () => {
  if (isServer()) {
    return '';
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? '';
};

export const saveAuthToken = (token: string | null) => {
  if (isServer() || !token) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, token);
  saveTokenToVault(token).catch(() => {});
};

export const clearToken = () => {
  if (isServer()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  clearTokenFromVault().catch(() => {});
};

export const restoreTokenFromVault = async (): Promise<boolean> => {
  if (isServer()) {
    return false;
  }

  if (window.localStorage.getItem(STORAGE_KEY)) {
    return true;
  }

  try {
    const token = await readTokenFromVault();

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
