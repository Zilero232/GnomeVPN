'use client';

import { useEffect, useRef } from 'react';

import { isBrowser, lastNodeIdSetting, logger, vpnStatus } from '@/shared/lib';

import type { UseAdoptTunnelInput } from './use-adopt-tunnel.types';

import { ADOPT_ATTEMPTS, ADOPT_RETRY_MS } from '../../../config';

export const useAdoptTunnel = ({ status, onAdopted }: UseAdoptTunnelInput) => {
  const onAdoptedRef = useRef(onAdopted);
  const statusRef = useRef(status);

  onAdoptedRef.current = onAdopted;
  statusRef.current = status;

  useEffect(() => {
    let isStale = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const isAlreadyConnected = () => statusRef.current === 'connected';

    const warn = (error: unknown) => {
      logger.warn(`could not read tunnel status: ${String(error)}`);
    };

    const adopt = async (attempt = 0) => {
      if (isStale || isAlreadyConnected()) {
        return;
      }

      const [current, lastNodeId] = await Promise.all([vpnStatus(), lastNodeIdSetting.get()]);

      if (isStale || isAlreadyConnected()) {
        return;
      }

      if (current === 'connected') {
        onAdoptedRef.current(lastNodeId);

        return;
      }

      if (attempt + 1 < ADOPT_ATTEMPTS) {
        timer = setTimeout(() => {
          adopt(attempt + 1).catch(warn);
        }, ADOPT_RETRY_MS);
      }
    };

    const run = () => {
      adopt().catch(warn);
    };

    const resync = () => {
      if (document.visibilityState === 'visible') {
        run();
      }
    };

    run();

    if (isBrowser()) {
      document.addEventListener('visibilitychange', resync);
      window.addEventListener('focus', resync);
    }

    return () => {
      isStale = true;

      if (timer) {
        clearTimeout(timer);
      }

      if (isBrowser()) {
        document.removeEventListener('visibilitychange', resync);
        window.removeEventListener('focus', resync);
      }
    };
  }, []);
};
