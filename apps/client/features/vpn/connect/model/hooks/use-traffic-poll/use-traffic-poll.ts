'use client';

import { useEffect, useRef } from 'react';

import { isTauriMobile, logger, vpnStatus, vpnTraffic } from '@/shared/lib';

import type { UseTrafficPollInput } from './use-traffic-poll.types';

const TRAFFIC_POLL_MS = 1_000;

export const useTrafficPoll = ({ status, onTraffic, onLost }: UseTrafficPollInput) => {
  const onTrafficRef = useRef(onTraffic);
  const onLostRef = useRef(onLost);
  onTrafficRef.current = onTraffic;
  onLostRef.current = onLost;

  useEffect(() => {
    if (status !== 'connected' || !isTauriMobile()) {
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      try {
        if ((await vpnStatus()) !== 'connected') {
          stop();
          onLostRef.current();

          return;
        }

        onTrafficRef.current(await vpnTraffic());
      } catch (error) {
        logger.error(`traffic poll failed: ${String(error)}`);
      }
    };

    void poll();
    timer = setInterval(poll, TRAFFIC_POLL_MS);

    return stop;
  }, [status]);
};
