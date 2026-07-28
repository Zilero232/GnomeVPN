'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { getProtocol, setProtocol } from '@/shared/lib';

import type { TunnelProtocol } from '@gnomevpn/schemas';

export const useProtocolSelection = () => {
  const [protocol, setSelected] = useState<TunnelProtocol>(DEFAULT_PROTOCOL);

  useEffect(() => {
    getProtocol().then(setSelected);
  }, []);

  const select = (next: TunnelProtocol) => {
    setSelected(next);
    setProtocol(next);
  };

  return { protocol, select };
};
