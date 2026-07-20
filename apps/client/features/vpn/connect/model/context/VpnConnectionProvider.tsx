'use client';

import { usePlatform } from '@/entities/app/platform';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useAutoConnect, useVpnConnection } from '../hooks';
import { VpnConnectionContext } from './vpn-connection-context';

import type { ReactNode } from 'react';

export const VpnConnectionProvider = ({ children }: { children: ReactNode }) => {
  const { isDesktopApp } = usePlatform();

  const connection = useVpnConnection();
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();

  useAutoConnect({
    nodes,
    hasAccess,
    isConnected: connection.status !== 'disconnected',
    isReady: isDesktopApp && !isLoading && !isError,
    connect: connection.connect,
  });

  return (
    <VpnConnectionContext.Provider value={connection}>{children}</VpnConnectionContext.Provider>
  );
};
