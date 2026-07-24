'use client';

import { useEffect, useState } from 'react';

import { logger } from '../logger';
import { getDeviceId } from './device-id';

export const useDeviceId = (): string | null => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId()
      .then(setDeviceId)
      .catch((error: unknown) => {
        logger.warn(`cannot read the device id: ${String(error)}`);
      });
  }, []);

  return deviceId;
};
