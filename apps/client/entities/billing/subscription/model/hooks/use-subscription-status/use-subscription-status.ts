import { useQuery } from '@tanstack/react-query';

import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const INACTIVE_POLL_MS = 3_000;

export const useSubscriptionStatus = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
    refetchInterval: (query) => (query.state.data?.status === 'active' ? false : INACTIVE_POLL_MS),
  });

  return {
    subscription: data ?? null,
    isLoading,
    isError,
    refetch,
    hasAccess: data?.status === 'active',
  };
};
