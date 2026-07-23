'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useCurrentUser } from '@/entities/auth/user';
import { getDeviceUsage } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { getDeviceId, logger } from '@/shared/lib';

import type { UseDeviceUsageInput } from './use-device-usage.types';

const REFRESH_MS = 30_000;

export const useDeviceUsage = ({ status }: UseDeviceUsageInput = {}) => {
  const { isAuthenticated } = useCurrentUser();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const read = async () => {
      setDeviceId(await getDeviceId());
    };

    read().catch((error: unknown) => {
      logger.warn(`cannot read the device id: ${String(error)}`);
    });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.deviceUsage(status),
    queryFn: () => (deviceId === null ? null : getDeviceUsage(deviceId)),
    enabled: isAuthenticated && deviceId !== null,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });

  return { usage: data ?? null, isLoading };
};
