'use client';

import { useQuery } from '@tanstack/react-query';

import { listPlatforms } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

import type { IncyPlatform } from '../../../config';

import { PLATFORM_ICONS } from '../../../config';

export const usePlatforms = (): IncyPlatform[] => {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.platforms(),
    queryFn: listPlatforms,
    staleTime: Infinity
  });

  return (data ?? []).map((platform) => ({ ...platform, icon: PLATFORM_ICONS[platform.id] }));
};
