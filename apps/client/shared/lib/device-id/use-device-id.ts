'use client';

import { useIsomorphicLayoutEffect } from '@siberiacancode/reactuse';
import { useState } from 'react';

import { logger } from '../logger';
import { getDeviceId, readDeviceIdSync } from './device-id';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    const cached = readDeviceIdSync();

    if (cached) {
      setDeviceId(cached);

      return;
    }

    const load = async () => {
      try {
        setDeviceId(await getDeviceId());
      } catch (error) {
        logger.warn(`cannot read the device id: ${String(error)}`);
      }
    };

    void load();
  }, []);

  return deviceId;
};
