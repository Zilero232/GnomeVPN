import { queryClient } from '../query-client';
import { authClient, clearToken } from './auth-client';

export const resetSession = (): void => {
  clearToken();
  queryClient.clear();

  void authClient.getSession({ query: { disableCookieCache: true } }).catch(() => undefined);
};
