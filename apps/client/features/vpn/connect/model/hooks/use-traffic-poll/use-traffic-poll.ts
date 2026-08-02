'use client';

import { useEffect, useRef } from 'react';

import { isTauriMobile, logger, vpnStatus, vpnTraffic } from '@/shared/lib';

import type { UseTrafficPollInput } from './use-traffic-poll.types';

import { LOST_CONFIRMATIONS, TRAFFIC_POLL_MS } from '../../../config';

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
    let misses = 0;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      try {
        if ((await vpnStatus()) !== 'connected') {
          misses += 1;

          if (misses < LOST_CONFIRMATIONS) {
            return;
          }

          stop();
          onLostRef.current();

          return;
        }

        misses = 0;
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
