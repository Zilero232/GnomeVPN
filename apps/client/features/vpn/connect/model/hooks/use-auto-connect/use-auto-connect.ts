'use client';

import { useEffect, useRef } from 'react';

import {
  getAutoConnect,
  getLastNodeId,
  getProtocol,
  hideAppWindow,
  isVpnServiceAvailable,
  logger,
  takeTileConnectRequest,
  vpnStatus,
  wasManuallyDisconnected
} from '@/shared/lib';

import type { UseAutoConnectParams } from './use-auto-connect.types';

export const useAutoConnect = ({ nodes, hasAccess, isConnected, isReady, connect }: UseAutoConnectParams) => {
  const hasAttemptedRef = useRef(false);
  const fromTileRef = useRef(false);

  useEffect(() => {
    takeTileConnectRequest()
      .then((requested) => {
        fromTileRef.current ||= requested;
      })
      .catch((error: unknown) => {
        logger.error(`tile request check failed: ${String(error)}`);
      });
  }, []);

  useEffect(() => {
    if (hasAttemptedRef.current || !isReady || !hasAccess || isConnected || nodes.length === 0) {
      return;
    }

    hasAttemptedRef.current = true;

    const run = async () => {
      const [isEnabled, wasDisconnectedByUser] = await Promise.all([getAutoConnect(), wasManuallyDisconnected()]);

      const isFromTile = fromTileRef.current;

      if (!isFromTile && (!isEnabled || wasDisconnectedByUser)) {
        return;
      }

      if (!(await isVpnServiceAvailable())) {
        logger.warn('autoconnect: service unavailable, skipping');
        hasAttemptedRef.current = false;

        return;
      }

      const lastNodeId = await getLastNodeId();
      const target = nodes.find((node) => node.id === lastNodeId && node.status !== 'offline') ?? nodes.find((node) => node.status !== 'offline');

      if (!target) {
        logger.warn('autoconnect: no reachable node available');

        return;
      }

      logger.info(`autoconnect: connecting to ${target.country}`);

      await connect({
        nodeId: target.id,
        protocol: await getProtocol(),
        country: target.country,
        isAutomatic: true
      });

      if (isFromTile && (await vpnStatus()) === 'connected') {
        fromTileRef.current = false;
        await hideAppWindow();
      }
    };

    run().catch((error: unknown) => {
      logger.error(`autoconnect failed: ${String(error)}`);
      hasAttemptedRef.current = false;
    });
  }, [nodes, hasAccess, isConnected, isReady, connect]);
};
