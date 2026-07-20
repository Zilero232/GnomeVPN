'use client';

import { useQuery } from '@tanstack/react-query';
import { check } from '@tauri-apps/plugin-updater';

import { QUERY_KEYS } from '@/shared/constants';
import { isTauriDesktop } from '@/shared/lib';

import type { AvailableUpdate } from './use-update-check.types';

const STALE_TIME_MS = 30 * 60_000;

export const useUpdateCheck = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.updateCheck(),
    queryFn: async (): Promise<AvailableUpdate | null> => {
      if (!isTauriDesktop()) {
        return null;
      }

      const update = await check();

      return update ? { version: update.version, notes: update.body ?? null } : null;
    },
    enabled,
    retry: false,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
