'use client';

import { authClient, getAuthToken } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user ?? null;
  const hasToken = Boolean(getAuthToken());

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user) || hasToken,
    email: user?.email ?? '',
    name: user?.name ?? ''
  };
};
