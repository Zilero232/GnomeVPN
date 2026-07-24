'use client';

import { useQuery } from '@tanstack/react-query';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { listNodeEndpoints } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { probeNodeLatency } from '@/shared/lib';

import type { LatencyByNode } from '@/shared/lib';

const REFRESH_MS = 120_000;

const measure = async (): Promise<LatencyByNode> => {
  const targets = await listNodeEndpoints();

  return probeNodeLatency({ targets });
};

export const useNodeLatency = ({ isEnabled = true }: { isEnabled?: boolean } = {}) => {
  const { isAuthenticated } = useCurrentUser();
  const { isNativeApp } = usePlatform();

  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.nodeLatency(),
    queryFn: measure,
    enabled: isAuthenticated && isEnabled && isNativeApp,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: false,
    staleTime: REFRESH_MS,
  });

  return { latency: data ?? {}, isMeasuring: isFetching };
};
