'use client';

import { useEffect, useState } from 'react';

import { isBatteryUnrestricted, isTauriMobile, logger, requestBatteryUnrestricted } from '@/shared/lib';

export const useBatteryExemption = () => {
  const [isGranted, setIsGranted] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isTauriMobile()) {
      return;
    }

    let ignore = false;

    const check = async () => {
      try {
        const granted = await isBatteryUnrestricted();

        if (!ignore) {
          setIsGranted(granted);
        }
      } catch (error) {
        logger.warn(`battery exemption check failed: ${String(error)}`);
      }
    };

    const runCheck = () => {
      void check();
    };

    runCheck();

    window.addEventListener('focus', runCheck);
    document.addEventListener('visibilitychange', runCheck);

    return () => {
      ignore = true;

      window.removeEventListener('focus', runCheck);
      document.removeEventListener('visibilitychange', runCheck);
    };
  }, []);

  const request = async () => {
    setIsRequesting(true);

    try {
      setIsGranted(await requestBatteryUnrestricted());
    } catch (error) {
      logger.warn(`battery exemption request failed: ${String(error)}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return { isGranted, isRequesting, request };
};
