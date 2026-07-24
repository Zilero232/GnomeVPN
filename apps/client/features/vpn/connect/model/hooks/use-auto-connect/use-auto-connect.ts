'use client';

import { useEffect, useRef } from 'react';

import {
  getAutoConnect,
  getLastNodeId,
  hideAppWindow,
  isVpnServiceAvailable,
  logger,
  takeTileConnectRequest,
  wasManuallyDisconnected,
} from '@/shared/lib';

import type { UseAutoConnectParams } from './use-auto-connect.types';

export const useAutoConnect = ({
  nodes,
  hasAccess,
  isConnected,
  isReady,
  connect,
}: UseAutoConnectParams): void => {
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current || !isReady || !hasAccess || isConnected || nodes.length === 0) {
      return;
    }

    hasAttemptedRef.current = true;

    const run = async () => {
      const [isEnabled, wasDisconnectedByUser, isFromTile] = await Promise.all([
        getAutoConnect(),
        wasManuallyDisconnected(),
        takeTileConnectRequest(),
      ]);

      if (!isFromTile && (!isEnabled || wasDisconnectedByUser)) {
        return;
      }

      if (!(await isVpnServiceAvailable())) {
        logger.warn('autoconnect: service unavailable, skipping');
        hasAttemptedRef.current = false;

        return;
      }

      const lastNodeId = await getLastNodeId();
      const target =
        nodes.find((node) => node.id === lastNodeId && node.status !== 'offline') ??
        nodes.find((node) => node.status !== 'offline');

      if (!target) {
        logger.warn('autoconnect: no reachable node available');

        return;
      }

      logger.info(`autoconnect: connecting to ${target.country}`);

      await connect({ nodeId: target.id, country: target.country, isAutomatic: true });

      if (isFromTile) {
        await hideAppWindow();
      }
    };

    run().catch((error: unknown) => {
      logger.error(`autoconnect failed: ${String(error)}`);
      hasAttemptedRef.current = false;
    });
  }, [nodes, hasAccess, isConnected, isReady, connect]);
};
