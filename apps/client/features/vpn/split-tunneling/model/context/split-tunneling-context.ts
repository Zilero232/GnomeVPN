'use client';

import { createContext, useContext } from 'react';

import type { UseSplitTunneling } from '../hooks';

export const SplitTunnelingContext = createContext<UseSplitTunneling | null>(null);

export const useSplitTunnelingContext = (): UseSplitTunneling => {
  const value = useContext(SplitTunnelingContext);

  if (!value) {
    throw new Error('useSplitTunnelingContext must be used inside SplitTunnelingProvider');
  }

  return value;
};
