import { createAuthClient } from 'better-auth/react';

import { env } from '@/shared/config';
import { STORAGE_KEYS } from '@/shared/constants';
import { isServer } from '@/shared/lib';

const STORAGE_KEY = STORAGE_KEYS.authToken;

export const getAuthToken = () => {
  if (isServer()) {
    return '';
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? '';
};

export const saveAuthToken = (token: string | null): boolean => {
  if (isServer() || !token || window.localStorage.getItem(STORAGE_KEY) === token) {
    return false;
  }

  window.localStorage.setItem(STORAGE_KEY, token);

  return true;
};

export const clearToken = () => {
  if (isServer()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath: '/auth',
  fetchOptions: {
    auth: { type: 'Bearer', token: getAuthToken },
    onSuccess: (ctx) => {
      saveAuthToken(ctx.response.headers.get('set-auth-token'));
    }
  }
});
