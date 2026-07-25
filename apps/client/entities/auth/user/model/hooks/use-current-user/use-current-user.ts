'use client';

import { authClient, getAuthToken } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, error, isPending } = authClient.useSession();

  const user = session?.user ?? null;
  const authenticatedDespiteFetchError = Boolean(error) && Boolean(getAuthToken());

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user) || authenticatedDespiteFetchError,
    email: user?.email ?? '',
    name: user?.name ?? '',
  };
};
