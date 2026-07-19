'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { match } from 'ts-pattern';

import { apiErrorCode, connectTunnel, disconnectTunnel } from '@/shared/api';
import { type VpnEvent, vpnConnect, vpnDisconnect } from '@/shared/lib';

import type { VpnConnectionStatus } from './use-vpn-connection.types';

const CONNECT_TIMEOUT_MS = 15_000;

export const useVpnConnection = () => {
  const [status, setStatus] = useState<VpnConnectionStatus>('disconnected');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const generationRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      })
      .with({ type: 'disconnected' }, () => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);
      })
      .with({ type: 'error' }, ({ message }) => {
        clearWatchdog();
        setStatus('disconnected');
        setActiveNodeId(null);
        toast.error(message);
      })
      .with({ type: 'connecting' }, { type: 'handshake' }, { type: 'bytesUpdate' }, () => {})
      .exhaustive();
  };

  const connect = async (nodeId: string) => {
    const generation = ++generationRef.current;

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
