'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import type { LatencyByNode } from '@/shared/lib';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { QUERY_KEYS } from '@/shared/constants';

import type { UseNodeLatency, UseNodeLatencyInput } from './use-node-latency.types';

import { LATENCY_REFRESH_MS, LATENCY_STALE_MS } from '../../../config';
import { measureNodeLatency } from '../../../lib';

export const useNodeLatency = ({ isEnabled = true }: UseNodeLatencyInput = {}): UseNodeLatency => {
  const { isAuthenticated } = useCurrentUser();
  const { isNativeApp } = usePlatform();

  const lastMeasured = useRef<LatencyByNode>({});

  const { data, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.nodeLatency(),
    queryFn: measureNodeLatency,
    enabled: isAuthenticated && isEnabled && isNativeApp,
    refetchInterval: LATENCY_REFRESH_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: LATENCY_STALE_MS
  });

  if (data) {
    lastMeasured.current = data;
  }

  return { latency: data ?? lastMeasured.current, isMeasuring: isFetching, remeasure: refetch };
};
