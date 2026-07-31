'use client';

import { useEffect, useState } from 'react';

import {
  getAutoConnect,
  getAutoReconnect,
  isAutoStartEnabled,
  logger,
  setAutoConnect as persistAutoConnect,
  setAutoReconnect as persistAutoReconnect,
  setAutoStart as persistAutoStart
} from '@/shared/lib';

import type { UseStartupSettings } from './use-startup-settings.types';

export const useStartupSettings = (): UseStartupSettings => {
  const [autoStart, setAutoStartState] = useState(false);
  const [autoConnect, setAutoConnectState] = useState(false);
  const [autoReconnect, setAutoReconnectState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [start, connect, reconnect] = await Promise.all([isAutoStartEnabled(), getAutoConnect(), getAutoReconnect()]);

      setAutoStartState(start);
      setAutoConnectState(connect);
      setAutoReconnectState(reconnect);
      setIsLoading(false);
    };

    load().catch((error: unknown) => {
      logger.warn(`startup settings load failed: ${String(error)}`);
      setIsLoading(false);
    });
  }, []);

  const toggleAutoStart = async (value: boolean) => {
    setAutoStartState(value);
    await persistAutoStart(value);

    setAutoStartState(await isAutoStartEnabled());
  };

  const toggleAutoConnect = async (value: boolean) => {
    setAutoConnectState(value);
    await persistAutoConnect(value);
  };

  const toggleAutoReconnect = async (value: boolean) => {
    setAutoReconnectState(value);
    await persistAutoReconnect(value);
  };

  return {
    autoStart,
    autoConnect,
    autoReconnect,
    isLoading,
    toggleAutoStart,
    toggleAutoConnect,
    toggleAutoReconnect
  };
};
