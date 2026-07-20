'use client';

import { useQuery } from '@tanstack/react-query';

import { getLatestRelease } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

const STALE_TIME_MS = 10 * 60_000;

export const useRelease = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.release(),
    queryFn: getLatestRelease,
    enabled,
    retry: 1,
    staleTime: STALE_TIME_MS,
  });
