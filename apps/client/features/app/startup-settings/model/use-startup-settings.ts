'use client';

import { useEffect, useState } from 'react';

import {
  getAutoConnect,
  getAutoReconnect,
  getKillSwitch,
  isAutoStartEnabled,
  logger,
  setAutoConnect as persistAutoConnect,
  setAutoReconnect as persistAutoReconnect,
  setAutoStart as persistAutoStart,
  setKillSwitch as persistKillSwitch,
} from '@/shared/lib';

import type { UseStartupSettings } from './use-startup-settings.types';

export const useStartupSettings = (): UseStartupSettings => {
  const [autoStart, setAutoStartState] = useState(false);
  const [autoConnect, setAutoConnectState] = useState(false);
  const [killSwitch, setKillSwitchState] = useState(false);
  const [autoReconnect, setAutoReconnectState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [start, connect, kill, reconnect] = await Promise.all([
        isAutoStartEnabled(),
        getAutoConnect(),
        getKillSwitch(),
        getAutoReconnect(),
      ]);

      setAutoStartState(start);
      setAutoConnectState(connect);
      setKillSwitchState(kill);
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

  const toggleKillSwitch = async (value: boolean) => {
    setKillSwitchState(value);
    await persistKillSwitch(value);
  };

  const toggleAutoReconnect = async (value: boolean) => {
    setAutoReconnectState(value);
    await persistAutoReconnect(value);
  };

  return {
    autoStart,
    autoConnect,
    killSwitch,
    autoReconnect,
    isLoading,
    toggleAutoStart,
    toggleAutoConnect,
    toggleKillSwitch,
    toggleAutoReconnect,
  };
};
