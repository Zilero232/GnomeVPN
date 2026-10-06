'use client';

import { isNonNullish } from 'remeda';

import { authClient, getAuthToken } from '../auth-client';

export const useHasSession = (): boolean => {
  const { data: session } = authClient.useSession();

  return isNonNullish(session?.user) || Boolean(getAuthToken());
};
