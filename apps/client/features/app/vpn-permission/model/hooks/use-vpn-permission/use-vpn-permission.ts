'use client';

import { useEffect, useState } from 'react';

import { hasVpnPermission, isTauriMobile, logger, requestVpnPermission } from '@/shared/lib';

export const useVpnPermission = () => {
  const [isGranted, setIsGranted] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isTauriMobile()) {
      return;
    }

    const check = async () => {
      setIsGranted(await hasVpnPermission());
    };

    check().catch((error: unknown) => {
      logger.warn(`vpn permission check failed: ${String(error)}`);
    });
  }, []);

  const request = async () => {
    setIsRequesting(true);

    try {
      setIsGranted(await requestVpnPermission());
    } catch (error) {
      logger.warn(`vpn permission request failed: ${String(error)}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return { isGranted, isRequesting, request };
};
