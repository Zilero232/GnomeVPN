'use client';

import { useEffect, useRef } from 'react';

import { getLastNodeId, logger, vpnStatus } from '@/shared/lib';

import type { UseAdoptTunnelInput } from './use-adopt-tunnel.types';

export const useAdoptTunnel = ({ onAdopted }: UseAdoptTunnelInput) => {
  const onAdoptedRef = useRef(onAdopted);
  onAdoptedRef.current = onAdopted;

  useEffect(() => {
    let isStale = false;

    const adopt = async () => {
      const [current, lastNodeId] = await Promise.all([vpnStatus(), getLastNodeId()]);

      if (isStale || current !== 'connected') {
        return;
      }

      onAdoptedRef.current(lastNodeId);
    };

    adopt().catch((error: unknown) => {
      logger.warn(`could not read tunnel status: ${String(error)}`);
    });

    return () => {
      isStale = true;
    };
  }, []);
};
