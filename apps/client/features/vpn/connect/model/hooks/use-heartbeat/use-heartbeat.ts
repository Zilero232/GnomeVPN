'use client';

import { useEffect } from 'react';

import { sendHeartbeat } from '@/shared/api';
import { logger, useDeviceId } from '@/shared/lib';

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

    beat();

    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [status, deviceId]);
};
