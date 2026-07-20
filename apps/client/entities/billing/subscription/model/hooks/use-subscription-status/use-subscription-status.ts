'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/entities/auth/user';
import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const INACTIVE_POLL_MS = 3_000;

export const useSubscriptionStatus = () => {
  const { isAuthenticated } = useCurrentUser();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
    enabled: isAuthenticated,
    refetchInterval: (query) =>
      query.state.data?.status === 'active' || query.state.error ? false : INACTIVE_POLL_MS,
  });

  return {
    subscription: data ?? null,
    isLoading,
    isError,
    refetch,
    hasAccess: data?.status === 'active',
  };
};
