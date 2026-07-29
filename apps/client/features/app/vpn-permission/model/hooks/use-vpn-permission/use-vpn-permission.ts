'use client';

import { useEffect, useState } from 'react';

import {
  ensureNotificationPermission,
  hasVpnPermission,
  isTauriMobile,
  logger,
  requestVpnPermission
} from '@/shared/lib';

export const useVpnPermission = () => {
  const [isGranted, setIsGranted] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isTauriMobile()) {
      return;
    }

    const check = async () => {
      try {
        setIsGranted(await hasVpnPermission());
      } catch (error) {
        logger.warn(`vpn permission check failed: ${String(error)}`);
      }
    };

    const runCheck = () => {
      void check();
    };

    runCheck();

    window.addEventListener('focus', runCheck);
    document.addEventListener('visibilitychange', runCheck);

    return () => {
      window.removeEventListener('focus', runCheck);
      document.removeEventListener('visibilitychange', runCheck);
    };
  }, []);

  const request = async () => {
    setIsRequesting(true);

    try {
      const granted = await requestVpnPermission();
      setIsGranted(granted);

      if (granted) {
        await ensureNotificationPermission();
      }
    } catch (error) {
      logger.warn(`vpn permission request failed: ${String(error)}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return { isGranted, isRequesting, request };
};
