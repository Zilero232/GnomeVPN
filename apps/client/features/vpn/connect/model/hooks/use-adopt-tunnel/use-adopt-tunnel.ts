'use client';

import { useEffect, useRef } from 'react';

import { getLastNodeId, isTauriMobile, logger, vpnStatus, vpnTraffic } from '@/shared/lib';

import type { UseAdoptTunnelInput } from './use-adopt-tunnel.types';

const TRAFFIC_POLL_MS = 1_000;

export const useAdoptTunnel = ({ onAdopted, onTraffic, onLost }: UseAdoptTunnelInput) => {
  const onAdoptedRef = useRef(onAdopted);
  const onTrafficRef = useRef(onTraffic);
  const onLostRef = useRef(onLost);

  onAdoptedRef.current = onAdopted;
  onTrafficRef.current = onTraffic;
  onLostRef.current = onLost;

  useEffect(() => {
    let isStale = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const stopPoll = () => {
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    const pollTraffic = async () => {
      try {
        if ((await vpnStatus()) !== 'connected') {
          stopPoll();
          onLostRef.current();

          return;
        }

        onTrafficRef.current(await vpnTraffic());
      } catch (error) {
        logger.error(`traffic poll failed: ${String(error)}`);
      }
    };

    const adopt = async () => {
      const [current, lastNodeId] = await Promise.all([vpnStatus(), getLastNodeId()]);

      if (isStale || current !== 'connected') {
        return;
      }

      onAdoptedRef.current(lastNodeId);

      if (!isTauriMobile()) {
        return;
      }

      void pollTraffic();
      poll = setInterval(pollTraffic, TRAFFIC_POLL_MS);
    };

    adopt().catch((error: unknown) => {
      logger.warn(`could not read tunnel status: ${String(error)}`);
    });

    return () => {
      isStale = true;
      stopPoll();
    };
  }, []);
};
