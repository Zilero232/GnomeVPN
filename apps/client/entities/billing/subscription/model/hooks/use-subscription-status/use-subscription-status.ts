import { useQuery } from '@tanstack/react-query';

import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useSubscriptionStatus = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
  });

  return {
    subscription: data ?? null,
    isLoading,
    isError,
    refetch,
    hasAccess: data?.status === 'active',
  };
};
