'use client';

import { isPlaceholderEmail } from '@gnomevpn/schemas';

import { authClient, getAuthToken } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user ?? null;
  const hasToken = Boolean(getAuthToken());
  const email = user?.email ?? '';
  const hasRealEmail = Boolean(email) && !isPlaceholderEmail(email);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user) || hasToken,
    email: hasRealEmail ? email : '',
    hasRealEmail,
    name: user?.name ?? ''
  };
};
