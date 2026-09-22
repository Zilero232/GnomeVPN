import { useQuery } from '@tanstack/react-query';

import { getTelegramWidget } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useTelegramWidget = () =>
  useQuery({
    queryKey: QUERY_KEYS.telegramWidget(),
    queryFn: getTelegramWidget,
    staleTime: Number.POSITIVE_INFINITY
  });
