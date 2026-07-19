'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { match } from 'ts-pattern';

import { apiErrorCode, connectTunnel, disconnectTunnel } from '@/shared/api';
import {
  getAutoReconnect,
  getKillSwitch,
  logger,
  notify,
  setLastNodeId,
  setManuallyDisconnected,
  settleAll,
  type VpnEvent,
  vpnConnect,
  vpnDisconnect,
} from '@/shared/lib';

import type { VpnConnectionStatus, VpnTraffic } from './use-vpn-connection.types';

const EMPTY_TRAFFIC: VpnTraffic = { rx: 0, tx: 0 };

const CONNECT_TIMEOUT_MS = 15_000;

export const useVpnConnection = () => {
  const t = useTranslations('notifications');

  const [status, setStatus] = useState<VpnConnectionStatus>('disconnected');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [traffic, setTraffic] = useState<VpnTraffic>(EMPTY_TRAFFIC);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);

  const generationRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const countryRef = useRef('');
  const nodeIdRef = useRef<string | null>(null);

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const releaseTunnel = async () => {
    await settleAll('tunnel cleanup', [disconnectTunnel(), vpnDisconnect()]);
  };

  const resetConnection = () => {
    setStatus('disconnected');
    setActiveNodeId(null);
    setTraffic(EMPTY_TRAFFIC);
    setConnectedAt(null);
  };

  const onEvent = async (generation: number, event: VpnEvent) => {
    if (generation !== generationRef.current) {
      return;
    }

    await match(event)
      .with({ type: 'connected' }, async () => {
        clearWatchdog();
        setStatus('connected');
        setConnectedAt(new Date());
        wasConnectedRef.current = true;

        if (nodeIdRef.current) {
          await setLastNodeId(nodeIdRef.current);
        }

        await notify({
          title: t('connectedTitle'),
          body: t('connectedBody', { country: countryRef.current }),
          tone: 'success',
        });
      })
      .with({ type: 'disconnected' }, async () => {
        clearWatchdog();
        resetConnection();

        if (!wasConnectedRef.current) {
          return;
        }

        wasConnectedRef.current = false;

        await notify({ title: t('disconnectedTitle'), body: t('disconnectedBody') });
      })
      .with({ type: 'error' }, async ({ message }) => {
        clearWatchdog();
        resetConnection();
        toast.error(message);

        if (!wasConnectedRef.current) {
          return;
        }

        wasConnectedRef.current = false;

        await notify({ title: t('errorTitle'), body: message, tone: 'error' });
      })
      .with({ type: 'bytesUpdate' }, async ({ rx, tx }) => {
        setTraffic({ rx, tx });
      })
      .with({ type: 'connecting' }, { type: 'handshake' }, async () => {})
      .exhaustive();
  };

  const connect = async (nodeId: string, country = '', isAutomatic = false) => {
    const generation = ++generationRef.current;

    countryRef.current = country;
    nodeIdRef.current = nodeId;

    if (!isAutomatic) {
      await setManuallyDisconnected(false);
    }

    setStatus('connecting');
    setActiveNodeId(nodeId);

    watchdogRef.current = setTimeout(async () => {
      if (generation !== generationRef.current) {
        return;
      }

      watchdogRef.current = null;

      await releaseTunnel();

      resetConnection();
      toast.error(t('connectFailed'));
    }, CONNECT_TIMEOUT_MS);

    try {
      const [config, killSwitch, autoReconnect] = await Promise.all([
        connectTunnel(nodeId),
        getKillSwitch(),
        getAutoReconnect(),
      ]);

      await vpnConnect(
        config,
        async (event) => {
          await onEvent(generation, event);
        },
        { killSwitch, autoReconnect },
      );
    } catch (error) {
      if (generation !== generationRef.current) {
        return;
      }

      clearWatchdog();

      await releaseTunnel();

      resetConnection();

      const code = apiErrorCode(error);
      const message = code === 'PAYMENT_REQUIRED' ? t('subscriptionRequired') : t('connectFailed');

      logger.error(`vpn connect failed [${code}]: ${String(error)}`);

      toast.error(message);

      await notify({ title: t('errorTitle'), body: message, tone: 'error' });
    }
  };

  const disconnect = async ({ isAutomatic = false } = {}) => {
    generationRef.current += 1;
    clearWatchdog();

    if (!isAutomatic) {
      await setManuallyDisconnected(true);
    }

    await releaseTunnel();

    resetConnection();
  };

  return { status, activeNodeId, traffic, connectedAt, connect, disconnect };
};
