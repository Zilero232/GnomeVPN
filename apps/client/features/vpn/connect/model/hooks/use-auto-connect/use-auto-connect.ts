'use client';

import { useEffect, useRef } from 'react';

import { measureNodeLatency } from '@/entities/vpn/node';
import {
  autoConnectSetting,
  hideAppWindow,
  isTauriMobile,
  isVpnServiceAvailable,
  lastNodeIdSetting,
  logger,
  manuallyDisconnectedSetting,
  protocolSetting,
  takeTileConnectRequest,
  vpnStatus
} from '@/shared/lib';

import type { UseAutoConnectParams } from './use-auto-connect.types';

import { autoConnectTarget } from '../../../lib';

export const useAutoConnect = ({ nodes, hasAccess, isConnected, isReady, connect }: UseAutoConnectParams) => {
  const hasAttemptedRef = useRef(false);
  const fromTileRef = useRef(false);
  const needsAttentionRef = useRef(false);

  useEffect(() => {
    takeTileConnectRequest()
      .then(({ requested, needsAttention }) => {
        fromTileRef.current ||= requested;
        needsAttentionRef.current ||= needsAttention;
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
      const [isEnabled, wasDisconnectedByUser] = await Promise.all([autoConnectSetting.get(), manuallyDisconnectedSetting.get()]);

      const isFromTile = fromTileRef.current;

      if (!isFromTile && (isTauriMobile() || !isEnabled || wasDisconnectedByUser)) {
        return;
      }

      if (!(await isVpnServiceAvailable())) {
        logger.warn('autoconnect: service unavailable, skipping');
        hasAttemptedRef.current = false;

        return;
      }

      const [lastNodeId, latency] = await Promise.all([lastNodeIdSetting.get(), measureNodeLatency()]);

      const target = autoConnectTarget({ nodes, latency, lastNodeId });

      if (!target) {
        logger.warn('autoconnect: no node answered a probe, leaving the tunnel down');
        hasAttemptedRef.current = false;

        return;
      }

      logger.info(`autoconnect: connecting to ${target.country}`);

      await connect({
        nodeId: target.id,
        protocol: await protocolSetting.get(),
        country: target.country,
        isAutomatic: true
      });

      if (isFromTile && !needsAttentionRef.current && (await vpnStatus()) === 'connected') {
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
