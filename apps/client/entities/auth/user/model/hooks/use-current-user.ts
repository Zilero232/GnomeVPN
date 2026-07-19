'use client';

import { authClient } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user ?? null;

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user),
    email: user?.email ?? '',
    name: user?.name ?? '',
  };
};
