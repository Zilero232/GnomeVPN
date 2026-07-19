import { useQuery } from '@tanstack/react-query';

import { listNodes } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const HEALTH_REFRESH_MS = 60_000;

export const useNodes = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.nodes(),
    queryFn: listNodes,
    refetchInterval: HEALTH_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

  return { nodes: data ?? [], isLoading, isError };
};
