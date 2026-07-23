'use client';

import { useEffect } from 'react';

import {
  getAutoConnect,
  getLastNodeId,
  isVpnServiceAvailable,
  logger,
  takeTileConnectRequest,
  wasManuallyDisconnected,
} from '@/shared/lib';

import type { UseAutoConnectParams } from './use-auto-connect.types';

let hasAttempted = false;

export const useAutoConnect = ({
  nodes,
  hasAccess,
  isConnected,
  isReady,
  connect,
}: UseAutoConnectParams): void => {
  useEffect(() => {
    if (hasAttempted || !isReady || !hasAccess || isConnected || nodes.length === 0) {
      return;
    }

    const run = async () => {
      const [isEnabled, wasDisconnectedByUser, isFromTile] = await Promise.all([
        getAutoConnect(),
        wasManuallyDisconnected(),
        takeTileConnectRequest(),
      ]);

      if (!isFromTile && (!isEnabled || wasDisconnectedByUser)) {
        hasAttempted = true;

        return;
      }

      if (!(await isVpnServiceAvailable())) {
        logger.warn('autoconnect: service unavailable, skipping');

        return;
      }

      const lastNodeId = await getLastNodeId();
      const target =
        nodes.find((node) => node.id === lastNodeId && node.status !== 'offline') ??
        nodes.find((node) => node.status !== 'offline');

      if (!target) {
        logger.warn('autoconnect: no reachable node available');
        hasAttempted = true;

        return;
      }

      hasAttempted = true;
      logger.info(`autoconnect: connecting to ${target.country}`);

      await connect({ nodeId: target.id, country: target.country, isAutomatic: true });
    };

    run().catch((error: unknown) => {
      logger.error(`autoconnect failed: ${String(error)}`);
    });
  }, [nodes, hasAccess, isConnected, isReady, connect]);
};
