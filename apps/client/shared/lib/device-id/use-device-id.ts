'use client';

import { useIsomorphicLayoutEffect } from '@siberiacancode/reactuse';
import { useState } from 'react';

import { logger } from '../logger';
import { getDeviceId, readDeviceIdSync } from './device-id';

export const useDeviceId = (): string | null => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    const cached = readDeviceIdSync();

    if (cached) {
      setDeviceId(cached);

      return;
    }

    getDeviceId()
      .then(setDeviceId)
      .catch((error: unknown) => {
        logger.warn(`cannot read the device id: ${String(error)}`);
      });
  }, []);

  return deviceId;
};
