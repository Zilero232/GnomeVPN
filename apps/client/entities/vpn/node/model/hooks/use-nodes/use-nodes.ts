'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/entities/auth/user';
import { listNodes } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const HEALTH_REFRESH_MS = 60_000;

export const useNodes = () => {
  const { isAuthenticated } = useCurrentUser();

  const { data, isFetching, isError } = useQuery({
    queryKey: QUERY_KEYS.nodes(),
    queryFn: listNodes,
    enabled: isAuthenticated,
    refetchInterval: HEALTH_REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000)
  });

  return { nodes: data ?? [], isLoading: isFetching, isError };
};
