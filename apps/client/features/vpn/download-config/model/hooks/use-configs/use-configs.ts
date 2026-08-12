import { useQuery } from '@tanstack/react-query';

import { listConfigs, listConfigStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

import type { ConfigWithStatus } from './use-configs.types';

import { CONFIG_STATUS_REFRESH_MS } from './use-configs.constants';

export const useConfigs = () => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.configs(),
    queryFn: listConfigs
  });

  const { data: status } = useQuery({
    queryKey: QUERY_KEYS.configStatus(),
    queryFn: listConfigStatus,
    enabled: Boolean(data?.length),
    refetchInterval: CONFIG_STATUS_REFRESH_MS,
    staleTime: CONFIG_STATUS_REFRESH_MS
  });

  const online = new Set(status?.onlineIds ?? []);

  const configs: ConfigWithStatus[] = (data ?? []).map((config) => ({ ...config, isOnline: online.has(config.id) }));

  return { configs, isLoading };
};
