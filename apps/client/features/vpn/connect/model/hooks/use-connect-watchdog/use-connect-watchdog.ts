'use client';

import { useRef } from 'react';

import { logger } from '@/shared/lib';

import type { StartWatchdogInput } from './use-connect-watchdog.types';

const CONNECT_TIMEOUT_MS = 30_000;

export const useConnectWatchdog = () => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = ({ onTimeout }: StartWatchdogInput) => {
    clear();

    timerRef.current = setTimeout(async () => {
      timerRef.current = null;

      try {
        await onTimeout();
      } catch (error) {
        logger.error(`connect watchdog failed: ${String(error)}`);
      }
    }, CONNECT_TIMEOUT_MS);
  };

  return { start, clear };
};
