'use client';

import { resolveLimits } from '@gnomevpn/schemas';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/entities/auth/user';
import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const INACTIVE_POLL_MS = 3_000;

const ACTIVE_POLL_MS = 60_000;

export const useSubscriptionStatus = () => {
  const { isAuthenticated } = useCurrentUser();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      if (query.state.error) {
        return false;
      }

      return query.state.data?.status === 'active' ? ACTIVE_POLL_MS : INACTIVE_POLL_MS;
    },
  });

  const hasAccess = data?.status === 'active';

  return {
    subscription: data ?? null,
    isLoading,
    isError,
    refetch,
    hasAccess,
    limits: data?.limits ?? resolveLimits(0),
  };
};
