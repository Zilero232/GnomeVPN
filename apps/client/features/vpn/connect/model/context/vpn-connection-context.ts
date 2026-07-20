'use client';

import { createContext, useContext } from 'react';

import type { VpnConnectionValue } from './vpn-connection-context.types';

export const VpnConnectionContext = createContext<VpnConnectionValue | null>(null);

export const useVpnConnectionContext = (): VpnConnectionValue => {
  const value = useContext(VpnConnectionContext);

  if (!value) {
    throw new Error('useVpnConnectionContext must be used inside VpnConnectionProvider');
  }

  return value;
};
