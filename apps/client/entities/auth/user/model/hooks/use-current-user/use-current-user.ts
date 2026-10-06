'use client';

import { isPlaceholderEmail } from '@gnomevpn/schemas';

import { authClient, useHasSession } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();
  const hasSession = useHasSession();

  const user = session?.user ?? null;
  const email = user?.email ?? '';
  const hasRealEmail = Boolean(email) && !isPlaceholderEmail(email);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: hasSession,
    email: hasRealEmail ? email : '',
    hasRealEmail,
    name: user?.name ?? ''
  };
};
