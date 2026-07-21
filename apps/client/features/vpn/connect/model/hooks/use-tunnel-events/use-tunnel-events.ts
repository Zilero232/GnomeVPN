'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { match } from 'ts-pattern';

import { setLastNodeId } from '@/shared/lib';
import { useTunnelNotifications } from '../use-tunnel-notifications';

import type { HandleTunnelEventInput, UseTunnelEventsInput } from './use-tunnel-events.types';

export const useTunnelEvents = ({
  isCurrent,
  onConnected,
  onTraffic,
  onClosed,
  countryRef,
  nodeIdRef,
}: UseTunnelEventsInput) => {
  const { notifyConnected, notifyDisconnected, notifyError } = useTunnelNotifications();

  const wasConnectedRef = useRef(false);

  const takeWasConnected = (): boolean => {
    const wasConnected = wasConnectedRef.current;

    wasConnectedRef.current = false;

    return wasConnected;
  };

  const handleEvent = async ({ generation, event }: HandleTunnelEventInput) => {
    if (!isCurrent(generation)) {
      return;
    }

    await match(event)
      .with({ type: 'connected' }, async () => {
        onConnected();
        wasConnectedRef.current = true;

        if (nodeIdRef.current) {
          await setLastNodeId(nodeIdRef.current);
        }

        await notifyConnected(countryRef.current);
      })
      .with({ type: 'disconnected' }, async () => {
        onClosed();

        if (takeWasConnected()) {
          await notifyDisconnected();
        }
      })
      .with({ type: 'error' }, async ({ message }) => {
        onClosed();
        toast.error(message);

        if (takeWasConnected()) {
          await notifyError(message);
        }
      })
      .with({ type: 'bytesUpdate' }, async ({ rx, tx }) => {
        onTraffic({ rx, tx });
      })
      .with({ type: 'connecting' }, { type: 'handshake' }, async () => {})
      .exhaustive();
  };

  return {
    handleEvent,
    markConnected: () => {
      wasConnectedRef.current = true;
    },
  };
};
