import { useQuery } from '@tanstack/react-query';

import { listNodes } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useNodes = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.nodes(),
    queryFn: listNodes,
  });

  return { nodes: data ?? [], isLoading, isError };
};
