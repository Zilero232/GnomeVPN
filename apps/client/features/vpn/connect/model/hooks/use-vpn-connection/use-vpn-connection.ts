'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { match } from 'ts-pattern';

import { apiErrorCode, connectTunnel, disconnectTunnel } from '@/shared/api';
import { logger, notify, type VpnEvent, vpnConnect, vpnDisconnect } from '@/shared/lib';

import type { VpnConnectionStatus } from './use-vpn-connection.types';

const CONNECT_TIMEOUT_MS = 15_000;

export const useVpnConnection = () => {
  const t = useTranslations('notifications');

  const [status, setStatus] = useState<VpnConnectionStatus>('disconnected');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const generationRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(false);
  const countryRef = useRef('');

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const onEvent = (generation: number, event: VpnEvent) => {
    if (generation !== generationRef.current) {
      return;
    }

    match(event)
      .with({ type: 'connected' }, () => {
        clearWatchdog();
        setStatus('connected');
        wasConnectedRef.current = true;
        void notify({
          title: t('connectedTitle'),
          body: t('connectedBody', { country: countryRef.current }),
          tone: 'success',
        });
      })
      .with({ type: 'disconnected' }, () => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);

        if (wasConnectedRef.current) {
          wasConnectedRef.current = false;
          void notify({ title: t('disconnectedTitle'), body: t('disconnectedBody') });
        }
      })
      .with({ type: 'error' }, ({ message }) => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);
        toast.error(message);

        if (wasConnectedRef.current) {
          wasConnectedRef.current = false;
          void notify({ title: t('errorTitle'), body: message, tone: 'error' });
        }
      })
      .with({ type: 'connecting' }, { type: 'handshake' }, { type: 'bytesUpdate' }, () => {})
      .exhaustive();
  };

  const connect = async (nodeId: string, country = '') => {
    const generation = ++generationRef.current;

    countryRef.current = country;

    setStatus('connecting');
    setActiveNodeId(nodeId);

    watchdogRef.current = setTimeout(() => {
      if (generation !== generationRef.current) {
        return;
      }

      watchdogRef.current = null;

      void disconnectTunnel().catch(() => undefined);
      void vpnDisconnect().catch(() => undefined);

      setStatus('disconnected');
      setActiveNodeId(null);
      toast.error('Не удалось подключиться');
    }, CONNECT_TIMEOUT_MS);

    try {
      const config = await connectTunnel(nodeId);

      await vpnConnect(config, (event) => {
        onEvent(generation, event);
      });
    } catch (error) {
      if (generation !== generationRef.current) {
        return;
      }

      clearWatchdog();

      await disconnectTunnel().catch(() => undefined);

      setStatus('disconnected');
      setActiveNodeId(null);

      const code = apiErrorCode(error);

      logger.error(`vpn connect failed [${code}]: ${String(error)}`);

      toast.error(
        code === 'PAYMENT_REQUIRED' ? 'Требуется активная подписка' : 'Не удалось подключиться',
      );
    }
  };

  const disconnect = async () => {
    generationRef.current += 1;
    clearWatchdog();

    await disconnectTunnel().catch(() => undefined);

    await vpnDisconnect().catch(() => undefined);

    setStatus('disconnected');
    setActiveNodeId(null);
  };

  return { status, activeNodeId, connect, disconnect };
};
