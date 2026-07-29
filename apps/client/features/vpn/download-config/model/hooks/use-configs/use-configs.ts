import { useQuery } from '@tanstack/react-query';

import { listConfigs } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useConfigs = () => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.configs(),
    queryFn: listConfigs
  });

  return {
    configs: data ?? [],
    isLoading
  };
};
