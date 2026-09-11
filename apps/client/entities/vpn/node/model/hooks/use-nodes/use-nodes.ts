'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useCurrentUser } from '@/entities/auth/user';
import { listNodes } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

import { NODES_REFRESH_MS } from '../../../config';

export const useNodes = () => {
  const { isAuthenticated } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data, isFetching, isError, dataUpdatedAt } = useQuery({
    queryKey: QUERY_KEYS.nodes(),
    queryFn: listNodes,
    enabled: isAuthenticated,
    refetchInterval: NODES_REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000)
  });

  useEffect(() => {
    if (!dataUpdatedAt) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeLatency() });
  }, [dataUpdatedAt, queryClient]);

  return { nodes: data ?? [], isLoading: isFetching, isError };
};
