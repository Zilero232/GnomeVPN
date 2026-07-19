import { createAuthClient } from 'better-auth/react';

import { env } from '@/shared/config';

const STORAGE_KEY = 'gnomevpn.auth-token';

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
};

export const clearToken = () => {
  if (typeof window === 'undefined') {
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
      const token = ctx.response.headers.get('set-auth-token');
      saveAuthToken(token);
    },
  },
});
