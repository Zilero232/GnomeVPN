'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';

import { apiErrorCode, connectTunnel, disconnectTunnel } from '@/shared/api';
import {
  getAutoReconnect,
  getDeviceId,
  getSplitApps,
  logger,
  setManuallyDisconnected,
  settleAll,
  vpnConnect,
  vpnDisconnect,
} from '@/shared/lib';
import { useAdoptTunnel } from '../use-adopt-tunnel';
import { useConnectWatchdog } from '../use-connect-watchdog';
import { useHeartbeat } from '../use-heartbeat';
import { useTunnelEvents } from '../use-tunnel-events';
import { useTunnelNotifications } from '../use-tunnel-notifications';
import { useTunnelState } from '../use-tunnel-state';

import type { ConnectInput } from './use-vpn-connection.types';

export const useVpnConnection = () => {
  const t = useTranslations('notifications');

  const tunnel = useTunnelState();
  const watchdog = useConnectWatchdog();
  const { notifyError } = useTunnelNotifications();

  useHeartbeat({ status: tunnel.status });

  const generationRef = useRef(0);
  const countryRef = useRef('');
  const nodeIdRef = useRef<string | null>(null);

  const teardown = async () => {
    watchdog.clear();

    const deviceId = await getDeviceId();

    await settleAll({
      label: 'tunnel cleanup',
      tasks: [disconnectTunnel({ deviceId }), vpnDisconnect()],
    });

    tunnel.reset();
  };

  const events = useTunnelEvents({
    isCurrent: (generation) => generation === generationRef.current,
    onConnected: () => {
      watchdog.clear();
      tunnel.markConnected();
    },
    onClosed: () => {
      watchdog.clear();
      tunnel.reset();
    },
    onTraffic: tunnel.setTraffic,
    countryRef,
    nodeIdRef,
  });

  useAdoptTunnel({
    onAdopted: (nodeId) => {
      tunnel.markAdopted(nodeId);
      events.markConnected();
    },
  });

  const connect = async ({ nodeId, country = '', isAutomatic = false }: ConnectInput) => {
    const generation = ++generationRef.current;

    countryRef.current = country;
    nodeIdRef.current = nodeId;

    if (!isAutomatic) {
      await setManuallyDisconnected(false);
    }

    tunnel.markConnecting(nodeId);

    watchdog.start({
      onTimeout: async () => {
        if (generation !== generationRef.current) {
          return;
        }

        await teardown();
        toast.error(t('connectFailed'));
      },
    });

    try {
      const [deviceId, autoReconnect, splitApps] = await Promise.all([
        getDeviceId(),
        getAutoReconnect(),
        getSplitApps(),
      ]);

      const config = await connectTunnel({ nodeId, deviceId });

      await vpnConnect({
        config,
        autoReconnect,
        splitApps,
        onEvent: (event) => {
          events.handleEvent({ generation, event }).catch((error: unknown) => {
            logger.error(`tunnel event failed: ${String(error)}`);
          });
        },
      });
    } catch (error) {
      if (generation !== generationRef.current) {
        return;
      }

      await teardown();

      const code = apiErrorCode(error);
      const message = code === 'PAYMENT_REQUIRED' ? t('subscriptionRequired') : t('connectFailed');

      logger.error(`vpn connect failed [${code}]: ${String(error)}`);

      toast.error(message);
      await notifyError(message);
    }
  };

  const disconnect = async ({ isAutomatic = false } = {}) => {
    generationRef.current += 1;

    if (!isAutomatic) {
      await setManuallyDisconnected(true);
    }

    await teardown();
  };

  return {
    status: tunnel.status,
    activeNodeId: tunnel.activeNodeId,
    traffic: tunnel.traffic,
    connectedAt: tunnel.connectedAt,
    connect,
    disconnect,
  };
};
