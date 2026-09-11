'use client';

import { useEffect, useState } from 'react';

import { usePlatform } from '@/entities/app/platform';
import { autoConnectSetting, autoReconnectSetting, isAutoStartEnabled, logger, setAutoStart as persistAutoStart, useSetting } from '@/shared/lib';

import type { UseStartupSettings } from './use-startup-settings.types';

export const useStartupSettings = (): UseStartupSettings => {
  const { isDesktopApp: isDesktop, isReady } = usePlatform();

  const autoConnect = useSetting({ setting: autoConnectSetting, initial: true, isEnabled: isReady && isDesktop });
  const autoReconnect = useSetting({ setting: autoReconnectSetting, initial: true, isEnabled: isReady && isDesktop });

  const [autoStart, setAutoStartState] = useState(false);
  const [isLoadingAutoStart, setIsLoadingAutoStart] = useState(true);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isDesktop) {
      setIsLoadingAutoStart(false);

      return;
    }

    isAutoStartEnabled()
      .then(setAutoStartState)
      .catch((error: unknown) => {
        logger.warn(`autostart state read failed: ${String(error)}`);
      })
      .finally(() => setIsLoadingAutoStart(false));
  }, [isDesktop, isReady]);

  const toggleAutoConnect = async (value: boolean) => {
    autoConnect.write(value);
  };

  const toggleAutoReconnect = async (value: boolean) => {
    autoReconnect.write(value);
  };

  const toggleAutoStart = async (value: boolean) => {
    setAutoStartState(value);
    await persistAutoStart(value);

    setAutoStartState(await isAutoStartEnabled());
  };

  return {
    autoStart,
    autoConnect: autoConnect.value,
    autoReconnect: autoReconnect.value,
    isLoading: isLoadingAutoStart || autoConnect.isLoading || autoReconnect.isLoading,
    toggleAutoStart,
    toggleAutoConnect,
    toggleAutoReconnect
  };
};
