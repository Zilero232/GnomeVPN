import { useQuery } from '@tanstack/react-query';

import { getTelegramStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

import type { UseTelegramStatusInput } from './use-telegram-status.types';

import { LINK_POLL_MS } from './use-telegram-status.constants';

export const useTelegramStatus = ({ isAwaitingLink = false }: UseTelegramStatusInput = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.telegramStatus(),
    queryFn: getTelegramStatus,
    refetchInterval: (query) => (isAwaitingLink && !query.state.data?.isLinked ? LINK_POLL_MS : false)
  });
