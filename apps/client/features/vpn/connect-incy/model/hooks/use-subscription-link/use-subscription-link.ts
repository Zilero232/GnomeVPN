import { useQuery } from '@tanstack/react-query';

import { getSubscriptionLink } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useSubscriptionLink = () =>
  useQuery({
    queryKey: QUERY_KEYS.subscriptionLink(),
    queryFn: getSubscriptionLink
  });
