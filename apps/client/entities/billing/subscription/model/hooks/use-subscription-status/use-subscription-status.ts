'use client';

import { resolveLimits } from '@gnomevpn/schemas';
import { useQuery } from '@tanstack/react-query';

import { getSubscriptionStatus, useHasSession } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

import { SUBSCRIPTION_POLL } from './use-subscription-status.constants';

export const useSubscriptionStatus = () => {
  const hasSession = useHasSession();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
    enabled: hasSession,
    refetchOnWindowFocus: true,
    retry: SUBSCRIPTION_POLL.retries,
    refetchInterval: (query) => {
      if (query.state.error) {
        return Math.min(SUBSCRIPTION_POLL.errorMs * 2 ** query.state.fetchFailureCount, SUBSCRIPTION_POLL.maxErrorMs);
      }

      return query.state.data?.status === 'active' ? SUBSCRIPTION_POLL.activeMs : SUBSCRIPTION_POLL.inactiveMs;
    }
  });

  const hasAccess = data?.status === 'active';

  return {
    subscription: data ?? null,
    isLoading,
    isError,
    refetch,
    hasAccess,
    limits: data?.limits ?? resolveLimits(0)
  };
};
