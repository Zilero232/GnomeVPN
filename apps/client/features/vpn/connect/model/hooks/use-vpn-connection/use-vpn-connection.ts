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

  const releaseTunnel = async () => {
    const results = await Promise.allSettled([disconnectTunnel(), vpnDisconnect()]);

    for (const result of results) {
      if (result.status === 'rejected') {
        logger.warn(`tunnel cleanup failed: ${String(result.reason)}`);
      }
    }
  };

  const onEvent = async (generation: number, event: VpnEvent) => {
    if (generation !== generationRef.current) {
      return;
    }

    await match(event)
      .with({ type: 'connected' }, async () => {
        clearWatchdog();
        setStatus('connected');
        wasConnectedRef.current = true;

        await notify({
          title: t('connectedTitle'),
          body: t('connectedBody', { country: countryRef.current }),
          tone: 'success',
        });
      })
      .with({ type: 'disconnected' }, async () => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);

        if (!wasConnectedRef.current) {
          return;
        }

        wasConnectedRef.current = false;

        await notify({ title: t('disconnectedTitle'), body: t('disconnectedBody') });
      })
      .with({ type: 'error' }, async ({ message }) => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);
        toast.error(message);

        if (!wasConnectedRef.current) {
          return;
        }

        wasConnectedRef.current = false;

        await notify({ title: t('errorTitle'), body: message, tone: 'error' });
      })
      .with({ type: 'connecting' }, { type: 'handshake' }, { type: 'bytesUpdate' }, async () => {})
      .exhaustive();
  };

  const connect = async (nodeId: string, country = '') => {
    const generation = ++generationRef.current;

    countryRef.current = country;

    setStatus('connecting');
    setActiveNodeId(nodeId);

    watchdogRef.current = setTimeout(async () => {
      if (generation !== generationRef.current) {
        return;
      }

      watchdogRef.current = null;

      await releaseTunnel();

      setStatus('disconnected');
      setActiveNodeId(null);
      toast.error(t('connectFailed'));
    }, CONNECT_TIMEOUT_MS);

    try {
      const config = await connectTunnel(nodeId);

      await vpnConnect(config, async (event) => {
        await onEvent(generation, event);
      });
    } catch (error) {
      if (generation !== generationRef.current) {
        return;
      }

      clearWatchdog();

      await releaseTunnel();

      setStatus('disconnected');
      setActiveNodeId(null);

      const code = apiErrorCode(error);

      logger.error(`vpn connect failed [${code}]: ${String(error)}`);

      toast.error(code === 'PAYMENT_REQUIRED' ? t('subscriptionRequired') : t('connectFailed'));
    }
  };

  const disconnect = async () => {
    generationRef.current += 1;
    clearWatchdog();

    await releaseTunnel();

    setStatus('disconnected');
    setActiveNodeId(null);
  };

  return { status, activeNodeId, connect, disconnect };
};
