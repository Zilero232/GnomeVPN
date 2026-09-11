import type { ReactNode } from 'react';

import type { UseSplitTunneling } from '../hooks';

export type SplitTunnelingProviderProps = {
  children: ReactNode;
  value: UseSplitTunneling;
};
