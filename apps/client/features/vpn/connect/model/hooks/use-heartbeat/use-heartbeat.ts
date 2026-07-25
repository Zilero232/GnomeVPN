'use client';

import { useEffect } from 'react';

import { sendHeartbeat } from '@/shared/api';
import { isBrowser, logger, useDeviceId } from '@/shared/lib';

import type { UseHeartbeatInput } from './use-heartbeat.types';

const HEARTBEAT_INTERVAL_MS = 60_000;

export const useHeartbeat = ({ status }: UseHeartbeatInput) => {
  const deviceId = useDeviceId();

  useEffect(() => {
    if (status !== 'connected' || deviceId === null) {
      return;
    }

    const beat = async () => {
      try {
        await sendHeartbeat({ deviceId });
      } catch (error) {
        logger.error(`heartbeat failed: ${String(error)}`);
      }
    };

    const beatWhenVisible = () => {
      if (isBrowser() && document.visibilityState === 'visible') {
        void beat();
      }
    };

    void beat();

    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    document.addEventListener('visibilitychange', beatWhenVisible);
    window.addEventListener('focus', beatWhenVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', beatWhenVisible);
      window.removeEventListener('focus', beatWhenVisible);
    };
  }, [status, deviceId]);
};
