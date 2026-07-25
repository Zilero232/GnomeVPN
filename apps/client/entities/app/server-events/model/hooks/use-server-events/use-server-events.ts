'use client';

import { useEventSource } from '@siberiacancode/reactuse';
import { useQueryClient } from '@tanstack/react-query';

import { getAuthToken } from '@/shared/api';
import { env } from '@/shared/config';
import { QUERY_KEYS } from '@/shared/constants';
import { isServer } from '@/shared/lib';

import type { ServerEvent } from './use-server-events.types';

export const useServerEvents = ({ isEnabled }: { isEnabled: boolean }) => {
  const queryClient = useQueryClient();

  const token = isEnabled && !isServer() ? getAuthToken() : null;
  const url = token ? `${env.NEXT_PUBLIC_API_URL}/events?token=${encodeURIComponent(token)}` : null;

  useEventSource<string, ServerEvent>(url ?? '', ['message'], {
    immediately: url !== null,
    retry: true,
    select: (data) => JSON.parse(data) as ServerEvent,
    onMessage: (event) => {
      if (event.data?.type === 'devices-changed') {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deviceUsage() });
      }
    },
  });
};
