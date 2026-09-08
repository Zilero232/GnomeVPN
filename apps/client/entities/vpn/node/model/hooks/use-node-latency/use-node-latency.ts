'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import type { LatencyByNode } from '@/shared/lib';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { listNodeEndpoints } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { probeNodeLatency } from '@/shared/lib';

import type { UseNodeLatencyInput } from './use-node-latency.types';

const REFRESH_MS = 120_000;

const measure = async () => {
  const targets = await listNodeEndpoints();

  return probeNodeLatency({ targets });
};

export const useNodeLatency = ({ isEnabled = true }: UseNodeLatencyInput = {}) => {
  const { isAuthenticated } = useCurrentUser();
  const { isNativeApp } = usePlatform();

  const lastMeasured = useRef<LatencyByNode>({});

  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.nodeLatency(),
    queryFn: measure,
    enabled: isAuthenticated && isEnabled && isNativeApp,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: false,
    staleTime: REFRESH_MS
  });

  if (data) {
    lastMeasured.current = data;
  }

  return { latency: data ?? lastMeasured.current, isMeasuring: isFetching };
};
