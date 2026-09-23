import { queryClient } from '../query-client';
import { authClient, clearToken, saveAuthToken } from './auth-client';

export const resetSession = (): void => {
  clearToken();
  queryClient.clear();

  void authClient.getSession({ query: { disableCookieCache: true } }).catch(() => undefined);
};

export const startSession = (token: string | null): void => {
  if (saveAuthToken(token)) {
    queryClient.clear();
  }
};
