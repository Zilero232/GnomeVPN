'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { isNonNullish } from 'remeda';

import { useCurrentUser } from '@/entities/auth/user';
import { getDeviceUsage } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { useDeviceId } from '@/shared/lib';

import type { UseDeviceUsageInput } from './use-device-usage.types';

const REFRESH_MS = 30_000;

export const useDeviceUsage = ({ status }: UseDeviceUsageInput = {}) => {
  const { isAuthenticated } = useCurrentUser();
  const deviceId = useDeviceId();

  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.deviceUsage(deviceId ?? undefined),
    queryFn: () => (deviceId ? getDeviceUsage(deviceId) : null),
    enabled: isAuthenticated && isNonNullish(deviceId),
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (status === 'connected' || status === 'disconnected') {
      refetch();
    }
  }, [status, refetch]);

  return { usage: data ?? null, isLoading };
};
