'use client';

import type { TunnelProtocol } from '@gnomevpn/schemas';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { apiErrorCode, connectTunnel, disconnectTunnel } from '@/shared/api';
import {
  autoReconnectSetting,
  getDeviceId,
  logger,
  manuallyDisconnectedSetting,
  settleAll,
  splitSetting,
  vpnConnect,
  vpnDisconnect,
  vpnStatus
} from '@/shared/lib';

import type { ConnectInput } from './use-vpn-connection.types';

import { waitForDisconnected } from '../../../lib';
import { useAdoptTunnel } from '../use-adopt-tunnel';
import { useConnectWatchdog } from '../use-connect-watchdog';
import { useTrafficPoll } from '../use-traffic-poll';
import { useTunnelEvents } from '../use-tunnel-events';
import { useTunnelNotifications } from '../use-tunnel-notifications';
import { useTunnelState } from '../use-tunnel-state';

export const useVpnConnection = () => {
  const t = useTranslations('notifications');
  const toErrorMessage = useErrorMessage();

  const tunnel = useTunnelState();
  const watchdog = useConnectWatchdog();
  const { notifyError } = useTunnelNotifications();

  const generationRef = useRef(0);
  const countryRef = useRef('');
  const nodeIdRef = useRef<string | null>(null);
  const protocolRef = useRef<TunnelProtocol>(DEFAULT_PROTOCOL);

  const teardown = async () => {
    watchdog.clear();

    const deviceId = await getDeviceId();

    await settleAll({
      label: 'tunnel cleanup',
      tasks: [disconnectTunnel({ deviceId }), vpnDisconnect()]
    });

    tunnel.reset();
  };

  const events = useTunnelEvents({
    isCurrent: (generation) => generation === generationRef.current,
    onConnected: () => {
      watchdog.clear();
      tunnel.markConnected();
    },
    onReconnecting: () => {
      if (nodeIdRef.current) {
        tunnel.markConnecting(nodeIdRef.current);
      }
    },
    onClosed: () => {
      watchdog.clear();
      tunnel.reset();
    },
    onTraffic: tunnel.setTraffic,
    countryRef,
    nodeIdRef
  });

  useAdoptTunnel({
    status: tunnel.status,
    onAdopted: (nodeId) => {
      tunnel.markAdopted(nodeId);
      events.markConnected();
    }
  });

  useTrafficPoll({
    status: tunnel.status,
    onTraffic: tunnel.setTraffic,
    onLost: tunnel.reset
  });

  const connect = async ({ nodeId, protocol, country = '', isAutomatic = false }: ConnectInput) => {
    const generation = ++generationRef.current;

    countryRef.current = country;
    nodeIdRef.current = nodeId;
    protocolRef.current = protocol;

    if (!isAutomatic) {
      await manuallyDisconnectedSetting.set(false);
    }

    tunnel.markConnecting(nodeId);

    watchdog.start({
      onTimeout: async () => {
        if (generation !== generationRef.current) {
          return;
        }

        await teardown();
        toast.error(t('connectFailed'));
      }
    });

    try {
      const [deviceId, autoReconnect, split] = await Promise.all([getDeviceId(), autoReconnectSetting.get(), splitSetting.get()]);

      const config = await connectTunnel({ nodeId, deviceId, protocol });

      await vpnConnect({
        config,
        autoReconnect,
        split,
        onEvent: (event) => {
          events.handleEvent({ generation, event }).catch((error: unknown) => {
            logger.error(`tunnel event failed: ${String(error)}`);
          });
        }
      });
    } catch (error) {
      if (generation !== generationRef.current) {
        return;
      }

      await teardown();

      const code = apiErrorCode(error);
      const message = toErrorMessage(error);

      logger.error(`vpn connect failed [${code}]: ${String(error)}`);

      toast.error(message);
      await notifyError(message);
    }
  };

  const disconnect = async ({ isAutomatic = false } = {}) => {
    generationRef.current += 1;

    if (!isAutomatic) {
      await manuallyDisconnectedSetting.set(true);
    }

    await teardown();
  };

  const reconnect = async () => {
    const nodeId = nodeIdRef.current ?? tunnel.activeNodeId;

    if (!nodeId) {
      return;
    }

    await disconnect({ isAutomatic: true });

    if (!(await waitForDisconnected({ readStatus: vpnStatus }))) {
      logger.warn('tunnel did not report disconnected before reconnecting');
    }

    await connect({
      nodeId,
      protocol: protocolRef.current,
      country: countryRef.current,
      isAutomatic: true
    });
  };

  return {
    status: tunnel.status,
    activeNodeId: tunnel.activeNodeId,
    traffic: tunnel.traffic,
    connectedAt: tunnel.connectedAt,
    connect,
    disconnect,
    reconnect
  };
};
