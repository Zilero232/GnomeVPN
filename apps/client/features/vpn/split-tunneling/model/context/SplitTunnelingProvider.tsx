'use client';

import type { SplitTunnelingProviderProps } from './SplitTunnelingProvider.types';

import { SplitTunnelingContext } from './split-tunneling-context';

export const SplitTunnelingProvider = ({ value, children }: SplitTunnelingProviderProps) => (
  <SplitTunnelingContext.Provider value={value}>{children}</SplitTunnelingContext.Provider>
);
