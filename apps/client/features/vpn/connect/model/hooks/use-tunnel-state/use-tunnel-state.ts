'use client';

import { useState } from 'react';

import type { VpnConnectionStatus, VpnTraffic } from '../use-vpn-connection/use-vpn-connection.types';

const EMPTY_TRAFFIC: VpnTraffic = { rx: 0, tx: 0 };

export const useTunnelState = () => {
  const [status, setStatus] = useState<VpnConnectionStatus>('disconnected');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [traffic, setTrafficState] = useState<VpnTraffic>(EMPTY_TRAFFIC);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);

  const setTraffic = (next: VpnTraffic) => {
    setTrafficState(next);

    if (next.uptimeSeconds && next.uptimeSeconds > 0) {
      setConnectedAt(new Date(Date.now() - next.uptimeSeconds * 1_000));
    }
  };

  const markConnecting = (nodeId: string) => {
    setStatus('connecting');
    setActiveNodeId(nodeId);
    setTrafficState(EMPTY_TRAFFIC);
  };

  const markConnected = () => {
    setStatus('connected');
    setConnectedAt(new Date());
  };

  const markAdopted = (nodeId: string | null) => {
    setStatus('connected');
    setActiveNodeId(nodeId);
    setConnectedAt((current) => current ?? new Date());
  };

  const reset = () => {
    setStatus('disconnected');
    setActiveNodeId(null);
    setTrafficState(EMPTY_TRAFFIC);
    setConnectedAt(null);
  };

  return {
    status,
    activeNodeId,
    traffic,
    connectedAt,
    setTraffic,
    markConnecting,
    markConnected,
    markAdopted,
    reset
  };
};
