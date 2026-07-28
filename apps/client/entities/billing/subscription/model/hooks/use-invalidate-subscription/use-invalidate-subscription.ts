'use client';

import { useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

export const useInvalidateSubscription = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
};
