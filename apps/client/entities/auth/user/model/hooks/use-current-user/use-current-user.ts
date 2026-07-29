'use client';

import { isNonNullish } from 'remeda';

import { authClient, getAuthToken } from '@/shared/api';

const REJECTED_STATUSES = [401, 403];

export const useCurrentUser = () => {
  const { data: session, error, isPending } = authClient.useSession();

  const user = session?.user ?? null;

  const wasRejected = isNonNullish(error?.status) && REJECTED_STATUSES.includes(error.status);
  const authenticatedDespiteFetchError = Boolean(error) && !wasRejected && Boolean(getAuthToken());

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user) || authenticatedDespiteFetchError,
    email: user?.email ?? '',
    name: user?.name ?? ''
  };
};
